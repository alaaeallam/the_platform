// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import User from "@/models/User";      // adjust path if different
import { connectDb } from "@/utils/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDb();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    await User.create({ email, password: hash, name, role: "customer" });

    return NextResponse.json({ ok: true, message: "Account created successfully." }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}