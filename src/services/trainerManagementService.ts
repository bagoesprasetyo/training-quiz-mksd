import { supabase } from './supabase';
import type { UserProfile } from '../types';

export const trainerManagementService = {
  // Fetch all registered trainers from profiles
  async getTrainers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'trainer')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Toggle active/disable status for a trainer
  async toggleTrainerStatus(trainerId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', trainerId);

    if (error) throw error;
  },

  // Create new trainer profile record
  async createTrainerProfile(id: string, email: string, fullName: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id,
        email,
        full_name: fullName,
        role: 'trainer',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
