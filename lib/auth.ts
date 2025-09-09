import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import User from "@/models/User";
import { connectDb } from "@/utils/db";

// Extend types for JWT and Session
interface ExtendedUser extends NextAuthUser {
  role?: string;
}

interface ExtendedToken extends JWT {
  role?: string;
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login", error: "/login" },
  providers: [
    // --- Credentials ---
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDb();

        const user = await User.findOne({ email: credentials.email }).lean<{
          _id: unknown;
          name?: string;
          email: string;
          image?: string;
          password?: string;
          role?: string;
        } | null>();

        if (!user || !user.password) throw new Error("This email does not exist.");
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) throw new Error("Email or password is wrong!");

        return {
          id: String(user._id),
          name: user.name ?? null,
          email: user.email,
          image: user.image,
          role: user.role ?? "customer",
        };
      },
    }),

    // --- Google OAuth ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 15000,
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "customer", // default role
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }): Promise<ExtendedToken> {
      const t = token as ExtendedToken;
      if (user) {
        const u = user as ExtendedUser;
        t.role = u.role ?? "customer";
      }
      return t;
    },
    async session({ session, token }): Promise<Session> {
      const t = token as ExtendedToken;
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as ExtendedUser).role = t.role ?? "customer";
      }
      return session;
    },
  },
};