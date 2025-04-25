import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Session, User } from "next-auth";

// Define base types
type UserRole = "user" | "admin";

interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  name: string | null;
  image: string | null;
}

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & User;
  }
  interface User extends BaseUser {
    username: string;
  }
}

// Extend the built-in token types
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string | null;
    role?: string;
    status: string;
    name: string | null;
    image: string | null;
    sub?: string;
  }
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user && typeof user === "object") {
        return {
          ...token,
          id: String(user.id || ""),
          email: user.email || null,
          role: user.role || "user",
          status: user.status || "active",
          name: user.name || null,
          image: user.image || null,
        };
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      return {
        ...session,
        user: {
          ...session.user,
          id: String(token.id || ""),
          email: token.email || "",
          role: token.role || "user",
          status: token.status || "active",
          name: token.name || null,
          image: token.image || null,
          username: session.user.username || "",
        },
      };
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isHomepage = nextUrl.pathname.startsWith("/");
      if (isHomepage) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.username || !credentials?.password) return null;
        
        try {
          const res = await fetch("http://127.0.0.1:8000/auth/login/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Authentication failed");
          }

          if (res.ok && data) {
            const user: User = {
              id: String(data.user.id || ""),
              username: data.user.username || "",
              email: data.user.email || "",
              role: (data.user.role as UserRole) || "user",
              status: data.user.status || "active",
              name: data.user.username || null,
              image: null,
            };
            return user;
          }
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }

        return null;
      },
    }),
  ],
};

export const { auth, signIn, signOut } = NextAuth(authConfig); 