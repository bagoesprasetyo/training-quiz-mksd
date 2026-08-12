import { supabase } from './supabase';
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
    // 1. Fetch quiz info
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizErr) throw quizErr;

    // 2. Fetch quiz questions in sorted order
    const { data: quizQuestions, error: qqErr } = await supabase
      .from('quiz_questions')
      .select('sort_order, questions(*, options:question_options(*))')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true });

    if (qqErr) throw qqErr;

    const questions: Question[] = (quizQuestions || []).map((item: any) => ({
      ...item.questions,
      options: (item.questions.options || []).sort((a: QuestionOption, b: QuestionOption) => a.sort_order - b.sort_order),
    }));

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

    const insertPayload: any = {
      title: quizData.title || 'Untitled Training Quiz',
      description: quizData.description || '',
      category_id: quizData.category_id || null,
      thumbnail_url: quizData.thumbnail_url || null,
      passing_grade: quizData.passing_grade || 70,
      status: 'draft',
    };

    if (userId) {
      insertPayload.created_by = userId;
    }

    const { data, error } = await supabase
      .from('quizzes')
      .insert(insertPayload)
      .select()
      .single();

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
    // Delete existing junction entries
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);

    // Insert new order entries
    const entries = questionIds.map((qId, index) => ({
      quiz_id: quizId,
      question_id: qId,
      sort_order: index,
    }));

    if (entries.length > 0) {
      const { error } = await supabase.from('quiz_questions').insert(entries);
      if (error) throw error;
    }
  },
};
