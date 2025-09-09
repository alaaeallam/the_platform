import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { connectDb } from "@/utils/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/utils/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Invalid email." }, { status: 400 });
    }

    await connectDb();
    const user = await User.findOne({ email }).lean<{ _id: any; email: string } | null>();

    // Always respond 200 to avoid email enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link was sent." }, { status: 200 });
    }

    // Create raw token, store only hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.findOneAndUpdate(
      { userId: user._id },
      { tokenHash, expiresAt, createdAt: new Date() },
      { upsert: true, new: true }
    );

    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${base}/auth/reset/${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({ message: "If that email exists, a reset link was sent." }, { status: 200 });
  } catch (e) {
    console.error("forgot:", e);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}