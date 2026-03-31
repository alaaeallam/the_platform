// app/api/user/applyCoupon/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import db from "@/utils/db";
import User from "@/models/User";
import Cart from "@/models/Cart";
import Coupon from "@/models/Coupon";

/* ---------- Types ---------- */
type Ok = { totalAfterDiscount: number; discount: number };
type Err = { message: string };

type SessionUserLike = { id?: string; email?: string | null };

type CouponLean = {
  _id: unknown;
  coupon?: string | null;
  code?: string | null;
  discount?: number | null;
  type?: "PERCENT" | "AMOUNT";
  startDate?: Date | null;
  endDate?: Date | null;
  isActive?: boolean;
  usageLimit?: number | null;
  usedCount?: number | null;
};

const BodySchema = z.object({
  coupon: z.string().trim().min(1, "Please provide a coupon code."),
});

const toMoney = (n: number) => Math.round(n * 100) / 100;

function fail(message: string, status = 400) {
  return NextResponse.json<Err>({ message }, { status });
}

function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase();
}

/* ---------- POST ---------- */
export async function POST(req: Request) {
  let connected = false;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail("Unauthorized", 401);
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
    }
    const code = normalizeCouponCode(parsed.data.coupon);

    await db.connectDb();
    connected = true;

    const s = session.user as unknown as SessionUserLike;
    const user =
      (s.email ? await User.findOne({ email: s.email }) : null) ??
      (s.id ? await User.findById(s.id) : null);
    if (!user) return fail("User not found.", 404);

    const cart = await Cart.findOne({ user: user._id });
    if (!cart) return fail("Cart not found.", 404);

    const cartTotal = Number(cart.cartTotal) || 0;
    if (cartTotal <= 0) {
      return fail("Your cart is empty.", 400);
    }

    const now = new Date();

    const doc = await Coupon.findOne({
      $or: [{ coupon: code }, { code }],
      isActive: true,
    }).lean<CouponLean | null>();

    if (!doc) return fail("Invalid coupon.", 404);

    if (doc.startDate && now < new Date(doc.startDate)) {
      return fail("Coupon not active yet.");
    }
    if (doc.endDate && now > new Date(doc.endDate)) {
      return fail("Coupon has expired.");
    }

    const usageLimit = doc.usageLimit ?? null;
    const usedCount = doc.usedCount ?? 0;
    if (usageLimit !== null && usedCount >= usageLimit) {
      return fail("Coupon usage limit has been reached.");
    }

    const kind = (doc.type ?? "PERCENT").toUpperCase();
    let discountAmount = 0;
    let uiPercent = 0;

    if (kind === "AMOUNT") {
      discountAmount = Math.max(0, Number(doc.discount) || 0);
      uiPercent = cartTotal > 0 ? Math.min(100, (discountAmount / cartTotal) * 100) : 0;
    } else {
      uiPercent = Math.max(0, Math.min(100, Number(doc.discount) || 0));
      discountAmount = (cartTotal * uiPercent) / 100;
    }

    const totalAfterDiscount = toMoney(Math.max(0, cartTotal - discountAmount));

    cart.totalAfterDiscount = totalAfterDiscount;
    await cart.save();

    const payload: Ok = {
      totalAfterDiscount,
      discount: Math.round(uiPercent * 100) / 100,
    };

    return NextResponse.json<Ok>(payload, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json<Err>({ message }, { status: 500 });
  } finally {
    if (connected) {
      try {
        await db.disconnectDb();
      } catch {
        /* ignore */
      }
    }
  }
}