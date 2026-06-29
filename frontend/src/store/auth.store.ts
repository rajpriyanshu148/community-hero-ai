import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { AuthUser, Role } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  updateTrustScore: (delta: number) => void;
  updateXP: (delta: number) => void;
  updateLevel: (level: number) => void;
  setLoading: (loading: boolean) => void;
  hasRole: (role: Role) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user: AuthUser) =>
          set({ user, isAuthenticated: true }, false, 'auth/setUser'),

        clearUser: () =>
          set({ user: null, isAuthenticated: false }, false, 'auth/clearUser'),

        updateTrustScore: (delta: number) =>
          set(
            (state) => ({
              user: state.user
                ? {
                    ...state.user,
                    trustScore: Math.min(100, Math.max(0, state.user.trustScore + delta)),
                  }
                : null,
            }),
            false,
            'auth/updateTrustScore'
          ),

        updateXP: (delta: number) =>
          set(
            (state) => ({
              user: state.user
                ? { ...state.user, xp: state.user.xp + delta }
                : null,
            }),
            false,
            'auth/updateXP'
          ),

        updateLevel: (level: number) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, level } : null,
            }),
            false,
            'auth/updateLevel'
          ),

        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, 'auth/setLoading'),

        hasRole: (role: Role) => {
          const { user } = get();
          return user?.role === role;
        },
      }),
      {
        name: 'community-hero-auth',
        partialize: (state) => ({
          user: state.user ? { ...state.user, accessToken: '' } : null,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
