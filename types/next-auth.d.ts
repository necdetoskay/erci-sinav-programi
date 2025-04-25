import { DefaultSession, DefaultUser } from "next-auth";
import { Role, Status } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: number;
      role: Role;
      status: Status;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    status: Status;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: Role;
    status: Status;
  }
} 