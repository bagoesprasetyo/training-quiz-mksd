import { supabase } from './supabase';
import { questionService } from './questionService';
import type { Quiz, Question, QuestionOption } from '../types';

export const quizService = {
  // Fetch quizzes created by current trainer or all quizzes for admin
  async getQuizzes(search?: string, status?: string): Promise<Quiz[]> {
    let query = supabase
      .from('quizzes')
      .select('*, questions_count:quiz_questions(count)')
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((q: any) => ({
      ...q,
      questions_count: q.questions_count?.[0]?.count || 0,
    }));
  },

  async getQuizById(quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> {
    // 1. Fetch quiz info safely
    let quiz: Quiz | null = null;
    try {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();
      quiz = quizData;
    } catch {
      // ignore
    }

    if (!quiz) {
      quiz = {
        id: quizId,
        title: 'Training Quiz',
        description: 'Interactive Corporate Quiz',
        created_by: 'system',
        status: 'published',
        passing_grade: 70,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    let questions: Question[] = [];

    // 2. Fetch questions via quiz_questions junction table
    try {
      const { data: qqData } = await supabase
        .from('quiz_questions')
        .select('question_id, sort_order')
        .eq('quiz_id', quizId)
        .order('sort_order', { ascending: true });

      if (qqData && qqData.length > 0) {
        const qIds = qqData.map((item: any) => item.question_id);
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .in('id', qIds);

        if (qData && qData.length > 0) {
          const { data: optData } = await supabase
            .from('question_options')
            .select('*')
            .in('question_id', qIds);

          const optionsMap: Record<string, QuestionOption[]> = {};
          (optData || []).forEach((opt: any) => {
            if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
            optionsMap[opt.question_id].push(opt);
          });

          questions = qIds
            .map((qId: string) => {
              const q = qData.find((item: any) => item.id === qId);
              if (!q) return null;
              return {
                ...q,
                options: (optionsMap[q.id] || []).sort((a: QuestionOption, b: QuestionOption) => (a.sort_order || 0) - (b.sort_order || 0)),
              };
            })
            .filter(Boolean) as Question[];
        }
      }
    } catch (err) {
      console.warn('Error fetching via quiz_questions:', err);
    }

    // 3. Local draft recovery (if Trainer side has unsynced draft)
    if (questions.length === 0) {
      try {
        const localDraft = localStorage.getItem(`draft_quiz_${quizId}`);
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          if (parsed.questions && parsed.questions.length > 0) {
            questions = await this.syncDraftQuestionsToSupabase(quizId, parsed.questions);
          }
        }
      } catch {
        // ignore
      }
    }

    return { quiz, questions };
  },

  async createQuiz(quizData: Partial<Quiz>): Promise<Quiz> {
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // ignore
    }

    if (!userId) {
      try {
        const stored = localStorage.getItem('mks_active_user');
        if (stored) {
          const profile = JSON.parse(stored);
          userId = profile?.id || null;
        }
      } catch {
        // ignore
      }
    }

    // Verify if userId exists in profiles table
    let validUserId: string | null = null;
    if (userId) {
      try {
        const { data: prof } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
        if (prof?.id) {
          validUserId = prof.id;
        }
      } catch {
        // ignore
      }
    }

    const insertPayload: any = {
      title: quizData.title || 'Untitled Training Quiz',
      description: quizData.description || '',
      category_id: quizData.category_id || null,
      thumbnail_url: quizData.thumbnail_url || null,
      passing_grade: quizData.passing_grade || 70,
      status: 'draft',
    };

    if (validUserId) {
      insertPayload.created_by = validUserId;
    }

    let { data, error } = await supabase
      .from('quizzes')
      .insert(insertPayload)
      .select()
      .single();

    // Fallback: If foreign key error occurs, retry without created_by
    if (error && (error.code === '23503' || error.message?.includes('foreign key constraint'))) {
      delete insertPayload.created_by;
      const res = await supabase
        .from('quizzes')
        .insert(insertPayload)
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) throw error;
    return data;
  },

  async updateQuiz(quizId: string, quizData: Partial<Quiz>): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .update({
        ...quizData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quizId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteQuiz(quizId: string): Promise<void> {
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) throw error;
  },

  async duplicateQuiz(quizId: string): Promise<Quiz> {
    const { quiz, questions } = await this.getQuizById(quizId);
    const newQuiz = await this.createQuiz({
      title: `${quiz.title} (Copy)`,
      description: quiz.description,
      category_id: quiz.category_id,
      passing_grade: quiz.passing_grade,
    });

    // Duplicate all questions and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { id, created_at, updated_at, options, ...qData } = q;
      
      const newQuestion = await supabase
        .from('questions')
        .insert({
          ...qData,
          created_by: newQuiz.created_by,
        })
        .select()
        .single();

      if (options && options.length > 0) {
        const optsToInsert = options.map((opt) => ({
          question_id: newQuestion.data.id,
          option_text: opt.option_text,
          option_image_url: opt.option_image_url,
          is_correct: opt.is_correct,
          sort_order: opt.sort_order,
        }));
        await supabase.from('question_options').insert(optsToInsert);
      }

      await supabase.from('quiz_questions').insert({
        quiz_id: newQuiz.id,
        question_id: newQuestion.data.id,
        sort_order: i,
      });
    }

    return newQuiz;
  },

  async updateQuizQuestionsOrder(quizId: string, questionIds: string[]): Promise<void> {
    // Only use valid UUIDs — never save local/fallback temp IDs to the junction table
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = questionIds.filter((id) => UUID_REGEX.test(id));

    // Delete existing junction entries
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);

    // Insert new order entries (only real UUIDs)
    const entries = validIds.map((qId, index) => ({
      quiz_id: quizId,
      question_id: qId,
      sort_order: index,
    }));

    if (entries.length > 0) {
      const { error } = await supabase.from('quiz_questions').insert(entries);
      if (error) throw error;
    }
  },

  async syncDraftQuestionsToSupabase(quizId: string, localQuestions: Question[]): Promise<Question[]> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const savedQuestions: Question[] = [];
    const validIds: string[] = [];

    for (const q of localQuestions) {
      const isUuid = q.id && UUID_REGEX.test(q.id);
      let realQuestion: Question | null = null;

      if (isUuid) {
        try {
          await questionService.updateQuestion(q.id, q, q.options);
          realQuestion = q;
        } catch {
          realQuestion = null;
        }
      }

      if (!realQuestion) {
        try {
          const saved = await questionService.createQuestion(
            {
              question_text: q.question_text,
              question_type: q.question_type,
              points_type: q.points_type,
              custom_points: q.custom_points,
              time_limit: q.time_limit,
              difficulty: q.difficulty,
              shuffle_answers: q.shuffle_answers,
              is_bank_question: false,
            },
            (q.options || []).map((opt) => ({
              option_text: opt.option_text,
              is_correct: opt.is_correct,
              sort_order: opt.sort_order,
            }))
          );
          realQuestion = saved;
        } catch {
          // ignore
        }
      }

      if (realQuestion) {
        savedQuestions.push(realQuestion);
        validIds.push(realQuestion.id);
      }
    }

    if (validIds.length > 0) {
      await this.updateQuizQuestionsOrder(quizId, validIds).catch(() => {});
    }

    // Update local draft storage with real UUID questions
    try {
      const draftStr = localStorage.getItem(`draft_quiz_${quizId}`);
      if (draftStr) {
        const parsed = JSON.parse(draftStr);
        localStorage.setItem(`draft_quiz_${quizId}`, JSON.stringify({
          ...parsed,
          questions: savedQuestions,
        }));
      }
    } catch {
      // ignore
    }

    return savedQuestions;
  },
};
