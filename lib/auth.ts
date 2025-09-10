import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import User from "@/models/User";
import { connectDb } from "@/utils/db";

interface ExtendedUser extends NextAuthUser {
  role?: string;
}
interface ExtendedToken extends JWT {
  role?: string;
}
type NextAuthOptionsWithTrust = NextAuthOptions & {
  trustHost?: boolean;
};
export const authOptions: NextAuthOptionsWithTrust = {

  adapter: MongoDBAdapter(clientPromise),
  trustHost: true,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
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
          image: user.image,
          role: user.role ?? "customer",
        };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: { timeout: 30000 },
      // allowDangerousEmailAccountLinking: true, // enable only if you intend it
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
        session.user.id = token.sub!;
        (session.user as ExtendedUser).role =
          (token as ExtendedToken).role ?? "customer";
      }
      return session;
    },
  },
};