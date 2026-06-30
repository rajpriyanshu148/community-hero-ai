import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { Role } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: Role;
      trustScore: number;
      level: number;
      wardNumber?: number;
      wardName?: string;
      accessToken: string;
    };
  }

  interface User {
    id: string;
    role?: Role;
    trustScore?: number;
    level?: number;
    wardNumber?: number;
    wardName?: string;
    accessToken?: string;
  }
}


const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!res.ok) return null;

          const data = await res.json();

          if (!data.success) return null;

          const { user, accessToken } = data.data;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatar,
            role: user.role,
            trustScore: user.trustScore,
            level: user.level,
            wardNumber: user.wardNumber,
            wardName: user.wardName,
            accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      const t = token as any;
      const u = user as any;
      // Initial sign in
      if (u) {
        t.id = u.id;
        t.role = u.role || Role.CITIZEN;
        t.trustScore = u.trustScore || 50;
        t.level = u.level || 1;
        t.wardNumber = u.wardNumber;
        t.wardName = u.wardName;
        t.accessToken = u.accessToken || '';
      }

      // Google OAuth — exchange for backend token
      if (account?.provider === 'google' && account.id_token) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: account.id_token }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              const { user: backendUser, accessToken } = data.data;
              t.id = backendUser.id;
              t.role = backendUser.role;
              t.trustScore = backendUser.trustScore;
              t.level = backendUser.level;
              t.wardNumber = backendUser.wardNumber;
              t.wardName = backendUser.wardName;
              t.accessToken = accessToken;
            }
          }
        } catch (err) {
          console.error('Google auth exchange failed:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      const t = token as any;
      const s = session as any;
      if (t && s.user) {
        s.user.id = t.id;
        s.user.role = t.role;
        s.user.trustScore = t.trustScore;
        s.user.level = t.level;
        s.user.wardNumber = t.wardNumber;
        s.user.wardName = t.wardName;
        s.user.accessToken = t.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
