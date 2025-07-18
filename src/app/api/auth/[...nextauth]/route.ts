/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import CredentialsProvider from 'next-auth/providers/credentials';
import UserModel from '@/models/User';
import { verifyPassword } from '@/lib/auth';
import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  debug: true,
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
            // console.error('Missing credentials');
            return null;
          }

          await connectToDatabase();

          const user = await UserModel.findOne({ email: credentials.email });
          // console.log("User found:", user ? "Yes" : "No");

          if (!user) {
            // console.error("User not found");
            return null;
          }

          // Get the password as a string
          const passwordString = String(user.get('password'));

          if (!passwordString) {
            // console.error("User has no password");
            return null;
          }

          const passwordInput =
            typeof credentials.password === 'string' ? credentials.password : '';
          const isValid = await verifyPassword(passwordInput, passwordString);
          // console.log('Password validation:', isValid ? 'Valid' : 'Invalid');

          if (!isValid) {
            // console.error('Invalid password');
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          // console.error('Auth error:', error);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectToDatabase();

          // Check if user already exists
          let dbUser = await UserModel.findOne({ email: user.email });

          // If user doesn't exist, create a new one
          if (!dbUser) {
            dbUser = await UserModel.create({
              name: user.name,
              email: user.email,
              image: user.image,
              // No password needed for Google auth
            });
          }

          // Update user ID to match our MongoDB ID
          user.id = dbUser._id.toString();

          return true;
        } catch (error) {
          // If there's an error, allow the sign-in to proceed but log the error
          return true;
        }
      }
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
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

// Export the request handlers for the Next.js route handler API
export const { GET, POST } = handlers;
