import { create } from 'zustand';
import type { UserProfile, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  fetchUser: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('mks_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mks_active_user');
    }
    set({ user, loading: false, initialized: true });
  },

  fetchUser: async () => {
    try {
      set({ loading: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Fallback to local session if profile was authenticated locally
        const storedUser = localStorage.getItem('mks_active_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed && parsed.email) {
              set({ user: parsed, loading: false, initialized: true });
              return parsed;
            }
          } catch {
            // ignore
          }
        }
        set({ user: null, loading: false, initialized: true });
        return null;
      }

      // Fetch profile from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        const fallbackProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          role: (session.user.user_metadata?.role as UserRole) || 'trainer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('mks_active_user', JSON.stringify(fallbackProfile));
        set({ user: fallbackProfile, loading: false, initialized: true });
        return fallbackProfile;
      }

      const userProfile: UserProfile = profile as UserProfile;
      localStorage.setItem('mks_active_user', JSON.stringify(userProfile));
      set({ user: userProfile, loading: false, initialized: true });
      return userProfile;
    } catch (err) {
      console.error('Error fetching user auth profile:', err);
      const storedUser = localStorage.getItem('mks_active_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          set({ user: parsed, loading: false, initialized: true });
          return parsed;
        } catch {
          // ignore
        }
      }
      set({ user: null, loading: false, initialized: true });
      return null;
    }
  },

  signOut: async () => {
    localStorage.removeItem('mks_active_user');
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    set({ user: null });
  },
}));
