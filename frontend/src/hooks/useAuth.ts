'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/types';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, clearUser } = useAuthStore();

  const hasRole = useCallback(
    (role: Role) => user?.role === role,
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles: Role[]) =>
      roles.some((r) => user?.role === r),
    [user]
  );

  const logout = useCallback(async () => {
    localStorage.removeItem('access_token');
    clearUser();
    router.push('/login');
  }, [clearUser, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    logout,
  };
}
