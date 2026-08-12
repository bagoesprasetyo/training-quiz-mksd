import { supabase } from './supabase';
import type { Question, QuestionOption, Category } from '../types';

export const questionService = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Question Bank & Questions
  async getBankQuestions(categoryId?: string, search?: string): Promise<Question[]> {
    let query = supabase
      .from('questions')
      .select('*, options:question_options(*)')
      .eq('is_bank_question', true)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (search) {
      query = query.ilike('question_text', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createQuestion(
    questionData: Partial<Question>,
    options: Partial<QuestionOption>[] = []
  ): Promise<Question> {
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // ignore
    }

    const insertPayload: any = {
      ...questionData,
    };
    if (userId) {
      insertPayload.created_by = userId;
    }

    // 1. Insert question
    const { data: newQuestion, error: qErr } = await supabase
      .from('questions')
      .insert(insertPayload)
      .select()
      .single();

    if (qErr) throw qErr;

    // 2. Insert options if provided
    if (options.length > 0) {
      const optionsToInsert = options.map((opt, index) => ({
        question_id: newQuestion.id,
        option_text: opt.option_text || `Option ${index + 1}`,
        option_image_url: opt.option_image_url || null,
        is_correct: opt.is_correct || false,
        sort_order: index,
      }));

      const { data: createdOptions, error: optErr } = await supabase
        .from('question_options')
        .insert(optionsToInsert)
        .select();

      if (optErr) throw optErr;
      newQuestion.options = createdOptions;
    }

    return newQuestion;
  },

  async updateQuestion(
    questionId: string,
    questionData: Partial<Question>,
    options?: Partial<QuestionOption>[]
  ): Promise<Question> {
    // 1. Update question fields
    const { data: updatedQ, error: qErr } = await supabase
      .from('questions')
      .update({
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        media_type: questionData.media_type,
        media_url: questionData.media_url,
        explanation: questionData.explanation,
        points_type: questionData.points_type,
        custom_points: questionData.custom_points,
        time_limit: questionData.time_limit,
        difficulty: questionData.difficulty,
        shuffle_answers: questionData.shuffle_answers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single();

    if (qErr) throw qErr;

    // 2. Update options if provided
    if (options) {
      await supabase.from('question_options').delete().eq('question_id', questionId);

      if (options.length > 0) {
        const optionsToInsert = options.map((opt, index) => ({
          question_id: questionId,
          option_text: opt.option_text || `Option ${index + 1}`,
          option_image_url: opt.option_image_url || null,
          is_correct: opt.is_correct || false,
          sort_order: index,
        }));

        const { data: createdOptions, error: optErr } = await supabase
          .from('question_options')
          .insert(optionsToInsert)
          .select();

        if (optErr) throw optErr;
        updatedQ.options = createdOptions;
      }
    }

    return updatedQ;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);
    if (error) throw error;
  },
};
