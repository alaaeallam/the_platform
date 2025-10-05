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
type Ok = { totalAfterDiscount: number; discount: number }; // discount shown in UI as a %
type Err = { message: string };

type SessionUserLike = { id?: string; email?: string | null };

/** What a coupon doc looks like when we .lean() it */
type CouponLean = {
  _id: unknown;
  coupon: string;
  discount: number;                     // percent
  type?: "PERCENT" | "AMOUNT";          // optional; default PERCENT
  startDate?: Date | null;
  endDate?: Date | null;
  isActive?: boolean;
};

const BodySchema = z.object({
  coupon: z.string().trim().min(1, "Please provide a coupon code."),
});

const toMoney = (n: number) => Math.round(n * 100) / 100;

function fail(message: string, status = 400) {
  return NextResponse.json<Err>({ message }, { status });
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
    const code = parsed.data.coupon.toUpperCase();

    await db.connectDb();
    connected = true;

    // resolve the current user (email for OAuth, fallback to id)
    const s = session.user as unknown as SessionUserLike;
    const user =
      (s.email ? await User.findOne({ email: s.email }) : null) ??
      (s.id ? await User.findById(s.id) : null);
    if (!user) return fail("User not found.", 404);

    // load the user's cart
    const cart = await Cart.findOne({ user: user._id });
    if (!cart) return fail("Cart not found.", 404);

    const now = new Date();

    // find an active coupon by code
    const doc = await Coupon.findOne({
      coupon: code,
      isActive: true,
    }).lean<CouponLean | null>();

    if (!doc) return fail("Invalid coupon.", 404);

    // time window checks (open-ended ranges allowed)
    if (doc.startDate && now < new Date(doc.startDate)) {
      return fail("Coupon not active yet.");
    }
    if (doc.endDate && now > new Date(doc.endDate)) {
      return fail("Coupon has expired.");
    }

    // compute the discount
    const cartTotal = Number(cart.cartTotal) || 0;
    const kind = (doc.type ?? "PERCENT").toUpperCase();
    let discountAmount = 0;
    let uiPercent = 0;

    if (kind === "AMOUNT") {
      // if you ever store fixed-amount coupons, replace `doc.discount` with `doc.amount`
      discountAmount = Math.max(0, Number(doc.discount) || 0);
      uiPercent = cartTotal > 0 ? Math.min(100, (discountAmount / cartTotal) * 100) : 0;
    } else {
      // default/typical case: percentage
      uiPercent = Math.max(0, Math.min(100, Number(doc.discount) || 0));
      discountAmount = (cartTotal * uiPercent) / 100;
    }

    const totalAfterDiscount = toMoney(Math.max(0, cartTotal - discountAmount));

    // persist to cart (so the order can use it)
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