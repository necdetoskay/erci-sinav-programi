import NextAuth, { DefaultSession, NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { User } from "next-auth";

const prisma = new PrismaClient();

interface ExtendedJWT extends JWT {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            // console.log('No user found or no password:', credentials.email); // Removed log
            throw new Error('No user found with this email');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            // console.log('Invalid password for user:', credentials.email); // Removed log
            throw new Error('Invalid password');
          }

          // console.log('Login successful for user:', credentials.email); // Removed log
          return user;
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      try {
        // console.log("JWT Callback - Input:", { token, user, account }); // Removed log
        
        if (user) {
          // User bilgilerini token'a ekle
          token.id = user.id;
          token.email = user.email;
          token.role = user.role;
          token.name = user.name;
        }

        // console.log("JWT Callback - Output token:", token); // Removed log
        return token as ExtendedJWT;
      } catch (error) {
        console.error("JWT Callback Error:", error);
        throw error; // Re-throw the error so NextAuth can handle it
      }
    },
    async session({ session, token }) {
      try {
        // console.log("Session Callback - Input:", { session, token }); // Removed log
        
        if (session.user && token) {
          // Token'dan gelen bilgileri session'a ekle
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.role = token.role as string;
          session.user.name = token.name as string | null;
        }

        // console.log("Session Callback - Output session:", session); // Removed log
        return session as ExtendedSession;
      } catch (error) {
        console.error("Session Callback Error:", error);
        throw error; // Re-throw the error
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Export auth utilities
export const auth = () => getServerSession(authOptions);
