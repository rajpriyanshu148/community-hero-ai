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

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    trustScore: number;
    level: number;
    wardNumber?: number;
    wardName?: string;
    accessToken: string;
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
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user.role as Role) || Role.CITIZEN;
        token.trustScore = user.trustScore || 50;
        token.level = user.level || 1;
        token.wardNumber = user.wardNumber;
        token.wardName = user.wardName;
        token.accessToken = user.accessToken || '';
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
              token.id = backendUser.id;
              token.role = backendUser.role;
              token.trustScore = backendUser.trustScore;
              token.level = backendUser.level;
              token.wardNumber = backendUser.wardNumber;
              token.wardName = backendUser.wardName;
              token.accessToken = accessToken;
            }
          }
        } catch (err) {
          console.error('Google auth exchange failed:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.trustScore = token.trustScore;
        session.user.level = token.level;
        session.user.wardNumber = token.wardNumber;
        session.user.wardName = token.wardName;
        session.user.accessToken = token.accessToken;
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
