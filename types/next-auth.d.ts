// types/next-auth.d.ts
import { DefaultSession, User as NextAuthUser } from "next-auth";
import "next-auth/jwt";

export type Role = "admin" | "customer";

declare module "next-auth" {
  interface User extends NextAuthUser {
    role?: Role;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      role?: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}