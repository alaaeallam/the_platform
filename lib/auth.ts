import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import User from "@/models/User";
import { connectDb } from "@/utils/db";
import https from "https";
const ipv4Agent = new https.Agent({ keepAlive: true, family: 4 }); // prefer IPv4

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login", error: "/login" },
  providers: [
    // --- Credentials (unchanged) ---
    Credentials({
      name: "Credentials",
      credentials: {
        email:    { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDb();

        const user = await User.findOne({ email: credentials.email }).lean<{
          _id: unknown; name?: string; email: string; image?: string; password?: string; role?: string;
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
        agent: ipv4Agent, 
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // When a user signs in (credentials or Google), persist role onto the token.
      if (user) (token as any).role = (user as any).role ?? "customer";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role ?? "customer";
      }
      return session;
    },
    /**
     * Optional: ensure a default role exists in DB for first-time OAuth users.
     * (MongoDBAdapter creates the user on first OAuth sign-in; we can backfill role.)
     */
    // async signIn({ user, account, profile, email, credentials }) {
    //   if (account?.provider === "google") {
    //     await connectDb();
    //     const doc = await User.findOne({ email: user.email });
    //     if (doc && !doc.role) {
    //       doc.role = "customer";
    //       await doc.save();
    //     }
    //   }
    //   return true;
    // },
  },
};