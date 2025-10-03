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

type Body = { coupon?: string };
type Ok = { totalAfterDiscount: number; discount: number }; // discount = percent used (for UI tag)
type Err = { message: string };

type SessionUserLike = { id?: string; email?: string | null };

/* ---------- Helpers ---------- */
const toMoney = (n: number) => Math.round(n * 100) / 100;
const getErrMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Server error";

/* ---------- POST ---------- */
export async function POST(req: Request) {
  let connected = false;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<Err>({ message: "Unauthorized" }, { status: 401 });
    }

    const { coupon: couponRaw } = (await req.json()) as Body;
    const code = (couponRaw ?? "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json<Err>({ message: "Please provide a coupon code." }, { status: 400 });
    }

    await db.connectDb();
    connected = true;

    // resolve user by email first (oauth), then id
    const s = session.user as unknown as SessionUserLike;
    const user =
      (s.email ? await User.findOne({ email: s.email }) : null) ??
      (s.id ? await User.findById(s.id) : null);
    if (!user) {
      return NextResponse.json<Err>({ message: "User not found." }, { status: 404 });
    }

    // find active & valid coupon
    const now = new Date();
    const couponDoc = await Coupon.findOne({
      code,                            // <-- correct field
      isActive: true,
      startAt: { $lte: now },
      endAt: { $gte: now },
    }).lean();

    if (!couponDoc) {
      return NextResponse.json<Err>({ message: "Invalid coupon" }, { status: 404 });
    }

    // load cart
    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return NextResponse.json<Err>({ message: "Cart not found." }, { status: 404 });
    }

    const cartTotal = Number(cart.cartTotal) || 0;

    // min order check
    if (couponDoc.minOrder && cartTotal < Number(couponDoc.minOrder)) {
      return NextResponse.json<Err>(
        { message: `Minimum order is ${couponDoc.minOrder}.` },
        { status: 400 }
      );
    }

    // compute discount
    const type = String(couponDoc.type || "").toUpperCase(); // "PERCENT" | "AMOUNT"
    const value = Number(couponDoc.value) || 0;

    let discountAmount = 0;
    let uiDiscountPercent = 0; // what your UI shows as "-{discount}%"

    if (type === "PERCENT") {
      uiDiscountPercent = Math.max(0, Math.min(100, value));
      discountAmount = (cartTotal * uiDiscountPercent) / 100;

      if (couponDoc.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(couponDoc.maxDiscount));
      }
    } else if (type === "AMOUNT") {
      discountAmount = Math.max(0, value);
      // translate amount to a percent for the UI label (bounded 0..100)
      uiDiscountPercent = cartTotal > 0 ? Math.min(100, (discountAmount / cartTotal) * 100) : 0;
    } else {
      return NextResponse.json<Err>({ message: "Unsupported coupon type." }, { status: 400 });
    }

    const totalAfterDiscount = toMoney(Math.max(0, cartTotal - discountAmount));

    // persist discounted total on the cart
    cart.totalAfterDiscount = totalAfterDiscount;
    await cart.save();

    const payload: Ok = {
      totalAfterDiscount,
      discount: Math.round(uiDiscountPercent * 100) / 100, // nice tidy percent
    };

    return NextResponse.json<Ok>(payload, { status: 200 });
  } catch (err) {
    return NextResponse.json<Err>({ message: getErrMessage(err) }, { status: 500 });
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