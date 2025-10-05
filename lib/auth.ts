// lib/auth.ts
import type { NextAuthOptions, User as NextAuthUser, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcrypt";

import clientPromise from "@/lib/mongoClient";
import User from "@/models/User";
import { connectDb } from "@/utils/db";
import type { Role } from "@/types/next-auth"; // <-- import the union type

interface ExtendedUser extends NextAuthUser {
  role: Role;
}

interface ExtendedToken extends JWT {
  role: Role;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

const THIRTY_DAYS = 60 * 60 * 24 * 30;
const isProd = process.env.NODE_ENV === "production";

// Runtime guard – converts anything to a valid Role
function toRole(value: unknown): Role {
  return value === "admin" ? "admin" : "customer";
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  session: { strategy: "jwt", maxAge: THIRTY_DAYS },
  jwt: { maxAge: THIRTY_DAYS },

  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProd },
    },
    callbackUrl: {
      name: isProd ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: { sameSite: "lax", path: "/", secure: isProd },
    },
    csrfToken: {
      name: isProd ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: { sameSite: "lax", path: "/", secure: isProd },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login", error: "/login" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials): Promise<ExtendedUser | null> => {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDb();

        const user = await User.findOne({ email: credentials.email })
          .select("+password name email image role")
          .lean<{ _id: unknown; name?: string | null; email: string; image?: string | null; password?: string; role?: Role | null } | null>();

        if (!user?.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: String(user._id),
          name: user.name ?? null,
          email: user.email,
          image: user.image ?? null,
          role: toRole(user.role),
        };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: { timeout: 30000 },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "customer" as Role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<ExtendedToken> {
      const t = token as ExtendedToken;
      const u = user as ExtendedUser | undefined;

      if (u) {
        // On initial sign in, set token fields from user
        t.sub = u.id;
        t.role = toRole(u.role);
        t.name = u.name ?? null;
        t.email = u.email ?? null;
        t.picture = u.image ?? null;
        return t;
      }

      if (t.email) {
        await connectDb();
        const doc = await User.findOne({ email: t.email }).select({ _id: 1, role: 1 }).lean<{ _id: unknown; role?: Role | null } | null>();

        if (doc) {
          t.sub = String(doc._id);
          t.role = toRole(doc.role);
        } else {
          t.role = toRole(t.role);
        }
      } else {
        t.role = toRole(t.role);
      }

      return t;
    },

    async session({ session, token }): Promise<Session> {
      const t = token as ExtendedToken;

      if (session.user) {
        session.user.id = t.sub ?? "";
        session.user.role = t.role ?? "customer";
      }

      return session;
    },
  },
};