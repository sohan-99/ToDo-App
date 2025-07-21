import NextAuth from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import CredentialsProvider from 'next-auth/providers/credentials';
import UserModel from '@/models/User';
import { verifyPassword } from '@/lib/auth';
import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV !== 'production',
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await connectToDatabase();

          const user = await UserModel.findOne({ email: credentials.email });
          if (!user) return null;

          const passwordString = String(user.get('password'));
          if (!passwordString) return null;

          const passwordInput =
            typeof credentials.password === 'string' ? credentials.password : '';
          const isValid = await verifyPassword(passwordInput, passwordString);
          if (!isValid) return null;

          const adminPermissions = user.adminPermissions
            ? {
                canUpdateUserInfo: user.adminPermissions.canUpdateUserInfo,
                canDeleteUsers: user.adminPermissions.canDeleteUsers,
              }
            : undefined;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role || 'user',
            adminPermissions: adminPermissions,
          };
        } catch {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
        if (user.role === 'admin' && user.adminPermissions) {
          token.adminPermissions = {
            canUpdateUserInfo: user.adminPermissions.canUpdateUserInfo,
            canDeleteUsers: user.adminPermissions.canDeleteUsers,
          };
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin' | 'super-admin';
        if (
          token.adminPermissions &&
          typeof token.adminPermissions === 'object' &&
          'canUpdateUserInfo' in token.adminPermissions &&
          'canDeleteUsers' in token.adminPermissions
        ) {
          session.user.adminPermissions = {
            canUpdateUserInfo:
              (token.adminPermissions as { canUpdateUserInfo: boolean }).canUpdateUserInfo === true,
            canDeleteUsers:
              (token.adminPermissions as { canDeleteUsers: boolean }).canDeleteUsers === true,
          };
        }
      }
      return session;
    },
    async signIn({ user, account }) {
      // Always allow sign-in for non-Google providers
      if (account?.provider !== 'google') return true;

      try {
        await connectToDatabase();

        // Check if user already exists or create a new one
        const dbUser = await UserModel.findOneAndUpdate(
          { email: user.email },
          {
            $setOnInsert: {
              name: user.name,
              email: user.email,
              image: user.image,
              role: 'user',
            },
          },
          { upsert: true, new: true }
        );

        user.id = dbUser._id.toString();
        user.role = dbUser.role;
        if (dbUser.role === 'admin' && dbUser.adminPermissions) {
          user.adminPermissions = {
            canUpdateUserInfo: dbUser.adminPermissions.canUpdateUserInfo,
            canDeleteUsers: dbUser.adminPermissions.canDeleteUsers,
          };
        }
      } catch {}

      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const { GET, POST } = handlers;
