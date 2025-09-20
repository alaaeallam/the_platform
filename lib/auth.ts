// lib/auth.ts
import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcrypt";

import clientPromise from "@/lib/mongoClient";
import User from "@/models/User";
import { connectDb } from "@/utils/db";

interface ExtendedUser extends NextAuthUser {
  role?: string;
}
interface ExtendedToken extends JWT {
  role?: string;
}

// 30 days (in seconds)
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const isProd = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions & { trustHost?: boolean } = {
  trustHost: true,

  // Persist users/sessions in MongoDB (fine to combine with JWT sessions)
  adapter: MongoDBAdapter(clientPromise),

  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS,
  },
  jwt: {
    maxAge: THIRTY_DAYS,
  },

  // Explicit cookie config for consistent behavior in dev/prod
  cookies: {
    sessionToken: {
      name: isProd
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    // Optional but nice to keep names predictable
    callbackUrl: {
      name: isProd
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: { sameSite: "lax", path: "/", secure: isProd },
    },
    csrfToken: {
      name: isProd ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: { sameSite: "lax", path: "/", secure: isProd },
    },
  },

  // Required secret (ensure set in .env)
  secret: process.env.NEXTAUTH_SECRET,

  pages: { signIn: "/login", error: "/login" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDb();

        const user = await User.findOne({ email: credentials.email })
          .select("+password")
          .lean<{
            _id: unknown;
            name?: string;
            email: string;
            image?: string;
            password?: string;
            role?: string;
          } | null>();

        if (!user?.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        return {
          id: String(user._id),
          name: user.name ?? null,
          email: user.email,
          image: user.image ?? null,
          role: user.role ?? "customer",
        };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.Google_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET!, // tolerate either env name
      httpOptions: { timeout: 30000 },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "customer",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<ExtendedToken> {
      if (user) {
        token.role = (user as ExtendedUser).role ?? "customer";
      }
      return token as ExtendedToken;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user) {
        // `sub` is the user id placed by NextAuth on the JWT
        session.user.id = token.sub ?? "";
        (session.user as ExtendedUser).role =
          (token as ExtendedToken).role ?? "customer";
      }
      return session;
    },
  },
};