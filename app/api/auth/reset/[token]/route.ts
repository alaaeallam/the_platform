import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDb } from "@/utils/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";

// POST { password } -> set new password and consume token
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const { password } = await req.json();

    if (!password || typeof password !== "string" || password.length < 6 || password.length > 36) {
      return NextResponse.json({ message: "Invalid password." }, { status: 400 });
    }

    await connectDb();

    const docs = await PasswordResetToken.find();
    // Compare raw token to stored hashes
    let matched: any = null;
    for (const d of docs) {
      if (await bcrypt.compare(token, d.tokenHash)) { matched = d; break; }
    }
    if (!matched) return NextResponse.json({ message: "Invalid or expired link." }, { status: 400 });
    if (matched.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: matched._id });
      return NextResponse.json({ message: "Link has expired." }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: matched.userId }, { $set: { password: hash } });
    await PasswordResetToken.deleteOne({ _id: matched._id });

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
  } catch (e) {
    console.error("reset:", e);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

// Optional: GET to pre-validate token for the reset page
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    await connectDb();
    const docs = await PasswordResetToken.find();
    for (const d of docs) {
      if (await bcrypt.compare(params.token, d.tokenHash) && d.expiresAt >= new Date()) {
        return NextResponse.json({ valid: true }, { status: 200 });
      }
    }
    return NextResponse.json({ valid: false }, { status: 400 });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}