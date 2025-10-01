// app/api/user/applyCoupon/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";           // if your repo keeps this in utils/auth, adjust import
import db from "@/utils/db";                         // adjust to your project (utils/db or lib/db)
import User from "@/models/User";
import Cart from "@/models/Cart";
import Coupon from "@/models/Coupon";

/* ---------- Types ---------- */

type Body = {
  coupon?: string;
};

type Ok = { totalAfterDiscount: number; discount: number };
type Err = { message: string };

/* ---------- Helpers ---------- */

function toMoney(n: number): number {
  // round to 2 decimals, as a number
  return Math.round(n * 100) / 100;
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

    // Find the user (by email first for OAuth, then by id if present)
    const user =
      (await User.findOne({ email: session.user.email })) ||
      (await User.findById((session.user as any)?.id));

    if (!user) {
      await db.disconnectDb();
      return NextResponse.json<Err>({ message: "User not found." }, { status: 404 });
    }

    // Validate coupon
    const couponDoc = await Coupon.findOne({ coupon: code });
    if (!couponDoc) {
      await db.disconnectDb();
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
  } catch (e: any) {
    // Ensure connection is closed on error
    try {
      await db.disconnectDb();
    } catch {}
    return NextResponse.json<Err>({ message: e?.message || "Server error" }, { status: 500 });
  }
}