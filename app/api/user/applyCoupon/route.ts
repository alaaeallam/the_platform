// app/api/user/applyCoupon/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import db from "@/utils/db";
import User from "@/models/User";
import Cart from "@/models/Cart";
import Coupon from "@/models/Coupon";

/* ---------- Types ---------- */

type Body = {
  coupon?: string;
};

type Ok = { totalAfterDiscount: number; discount: number };
type Err = { message: string };

/** Minimal shape we rely on from session.user */
type SessionUserLike = {
  id?: string;
  email?: string | null;
};

/* ---------- Helpers ---------- */

function toMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function getErrMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Server error";
}

/* ---------- POST ---------- */

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<Err>({ message: "Unauthorized" }, { status: 401 });
    }

    const { coupon } = (await req.json()) as Body;
    const code = (coupon ?? "").trim();

    if (!code) {
      return NextResponse.json<Err>({ message: "Please provide a coupon code." }, { status: 400 });
    }

    await db.connectDb();

    // Narrow the session user safely (no `any`)
    const u = session.user as unknown as SessionUserLike;

    // Find the user (prefer email for OAuth, fall back to id if present)
    const user =
      (u.email ? await User.findOne({ email: u.email }) : null) ??
      (u.id ? await User.findById(u.id) : null);

    if (!user) {
      await db.disconnectDb();
      return NextResponse.json<Err>({ message: "User not found." }, { status: 404 });
    }

    // Validate coupon
    const couponDoc = await Coupon.findOne({ coupon: code });
    if (!couponDoc) {
      await db.disconnectDb();
      // Keep 200 for "invalid coupon" UX if that's what you expect
      return NextResponse.json<Err>({ message: "Invalid coupon" }, { status: 200 });
    }

    // Load cart
    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      await db.disconnectDb();
      return NextResponse.json<Err>({ message: "Cart not found." }, { status: 404 });
    }

    const discount = Number(couponDoc.discount) || 0;
    const cartTotal = Number(cart.cartTotal) || 0;

    const totalAfterDiscount = toMoney(cartTotal - (cartTotal * discount) / 100);

    // Persist the discounted total on the cart
    cart.totalAfterDiscount = totalAfterDiscount;
    await cart.save();

    await db.disconnectDb();

    const payload: Ok = { totalAfterDiscount, discount };
    return NextResponse.json<Ok>(payload, { status: 200 });
  } catch (err: unknown) {
    const message = getErrMessage(err);
    try {
      await db.disconnectDb();
    } catch {
      /* ignore */
    }
    return NextResponse.json<Err>({ message }, { status: 500 });
  }
}