'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback } from 'react';
import type { Role } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        avatar: session.user.image ?? undefined,
        role: session.user.role,
        trustScore: session.user.trustScore,
        level: session.user.level,
        wardNumber: session.user.wardNumber,
        wardName: session.user.wardName,
        accessToken: session.user.accessToken,
        xp: 0, // loaded separately if needed
      }
    : null;

  const hasRole = useCallback(
    (role: Role) => session?.user?.role === role,
    [session]
  );

  const hasAnyRole = useCallback(
    (...roles: Role[]) =>
      roles.some((r) => session?.user?.role === r),
    [session]
  );

  const loginWithGoogle = useCallback(async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      return result;
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/' });
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    loginWithGoogle,
    loginWithCredentials,
    logout,
    status,
  };
}
