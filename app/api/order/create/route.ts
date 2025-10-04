// app/api/order/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth";
import db from "@/utils/db";
import User from "@/models/User";
import Cart from "@/models/Cart";
import Order, {
  type IOrderCreate,
  type IOrderProduct,
  type IShippingAddress,
} from "@/models/Order";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

/* ----------------------------- Types ----------------------------- */

type Body = {
  products?: Array<{
    product?: string;
    name?: string;
    image?: string;
    size?: string | number;
    qty?: number;
    color?: { color?: string; image?: string };
    price?: number;
  }>;
  shippingAddress?: Partial<IShippingAddress>;
  paymentMethod?: string;
  payment?: { provider: "stripe"; intentId: string } | undefined;
  total?: number; // ignored (client-provided)
  totalBeforeDiscount?: number; // ignored (client-provided)
  couponApplied?: string;
};

type Ok = { order_id: string };
type Err = { message: string };

/* ----------------------------- Helpers ----------------------------- */

const toMoney = (n: number) => Math.round(n * 100) / 100;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Server error");

function isValidAddress(a?: Partial<IShippingAddress>): a is IShippingAddress {
  if (!a) return false;
  const required: (keyof IShippingAddress)[] = [
    "firstName",
    "lastName",
    "phoneNumber",
    "address1",
    "city",
    "state",
    "zipCode",
    "country",
  ];
  return required.every(
    (k) => typeof a[k] === "string" && String(a[k]).trim().length > 0
  );
}

/* ------------------------------- POST ------------------------------ */

export async function POST(req: Request) {
  let connected = false;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<Err>({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;

    if (!body.paymentMethod) {
      return NextResponse.json<Err>(
        { message: "Payment method is required." },
        { status: 400 }
      );
    }
    if (!isValidAddress(body.shippingAddress)) {
      return NextResponse.json<Err>(
        { message: "Shipping address is incomplete." },
        { status: 400 }
      );
    }

    await db.connectDb();
    connected = true;

    // Resolve user by email (OAuth) or id
    const u = session.user as { id?: string; email?: string | null };
    const user =
      (u.email ? await User.findOne({ email: u.email }) : null) ??
      (u.id ? await User.findById(u.id) : null);

    if (!user?._id) {
      return NextResponse.json<Err>({ message: "User not found." }, { status: 404 });
    }
    const userId = new Types.ObjectId(String(user._id));

    // Load authoritative cart
    const cart = await Cart.findOne({ user: userId }).lean<{
      products: Array<{
        product: unknown;
        name: string;
        image: string;
        size?: string;
        qty: number;
        color?: { color?: string; image?: string };
        price: number;
      }>;
      cartTotal?: number;
      totalAfterDiscount?: number;
    } | null>();

    if (!cart || !Array.isArray(cart.products) || cart.products.length === 0) {
      return NextResponse.json<Err>({ message: "Your cart is empty." }, { status: 400 });
    }

    // Compute totals from cart
    const subtotal = cart.products.reduce(
      (acc, p) => acc + Number(p.price || 0) * Number(p.qty || 0),
      0
    );
    const subtotalRounded = toMoney(subtotal);

    const effectiveTotal = toMoney(
      typeof cart.totalAfterDiscount === "number"
        ? cart.totalAfterDiscount
        : subtotalRounded
    );

    // Map cart lines to order lines
    const orderProducts: IOrderProduct[] = cart.products.map((p) => ({
      product: new Types.ObjectId(String(p.product)),
      name: p.name,
      image: p.image,
      size: p.size,
      qty: Number(p.qty || 0),
      color: p.color ? { color: p.color.color, image: p.color.image } : undefined,
      price: Number(p.price || 0),
    }));

    // Normalize client method ids to canonical values
    const canonicalPaymentMethod = (() => {
      const pm = (body.paymentMethod || "").toLowerCase();
      if (pm === "paypal") return "paypal";
      if (pm === "cash" || pm === "cod") return "cash";
      // treat card brands / stripe as stripe
      if (pm === "stripe" || pm === "visa" || pm === "mastercard") return "stripe";
      return pm || "cash"; // default
    })();

    const payload: IOrderCreate = {
      user: userId,
      products: orderProducts,
      shippingAddress: {
        firstName: body.shippingAddress.firstName!,
        lastName: body.shippingAddress.lastName!,
        phoneNumber: body.shippingAddress.phoneNumber!,
        address1: body.shippingAddress.address1!,
        address2: body.shippingAddress.address2 ?? "",
        city: body.shippingAddress.city!,
        state: body.shippingAddress.state!,
        zipCode: body.shippingAddress.zipCode!,
        country: body.shippingAddress.country!,
      },
      paymentMethod: canonicalPaymentMethod,
      total: effectiveTotal,
      totalBeforeDiscount: subtotalRounded,
      couponApplied: body.couponApplied,
      shippingPrice: 0,
      taxPrice: 0,
      isPaid: false,
      status: "Not Processed",
      paymentResult: undefined,
      paidAt: undefined,
      deliveredAt: undefined,
    };

    // If Stripe payment info is provided, verify the intent and mark as paid
    if (body.payment?.provider === "stripe" && body.payment.intentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(body.payment.intentId, {
          expand: ["latest_charge"],
        });
        if (pi.status === "succeeded") {
          // Optional integrity checks
          // if (pi.amount !== Math.round(effectiveTotal * 100)) {
          //   return NextResponse.json<Err>({ message: "Payment amount mismatch." }, { status: 400 });
          // }
          const latestCharge = (pi.latest_charge ?? null) as Stripe.Charge | string | null;
          const receiptUrl =
            typeof latestCharge === "object" && latestCharge !== null
              ? latestCharge.receipt_url ?? undefined
              : undefined;

          payload.isPaid = true;
          payload.paidAt = new Date();
          payload.paymentMethod = "stripe";
          payload.paymentResult = {
            id: pi.id,
            status: pi.status,
            amount: pi.amount,
            currency: pi.currency,
            receipt_url: receiptUrl,
          } as {
            id: string;
            status: string;
            amount: number;
            currency: string;
            receipt_url?: string;
          };
          payload.status = "Not Processed";
        } else {
          return NextResponse.json<Err>({ message: "Payment not completed." }, { status: 400 });
        }
      } catch (e) {
        return NextResponse.json<Err>(
          { message: `Unable to verify payment: ${errMsg(e)}` },
          { status: 400 }
        );
      }
    }

    const created = await Order.create(payload);

    // Clear cart (optional, but typical)
    await Cart.updateOne(
      { user: userId },
      { $set: { products: [], cartTotal: 0 }, $unset: { totalAfterDiscount: "" } }
    );

    return NextResponse.json<Ok>({ order_id: String(created._id) }, { status: 200 });
  } catch (e) {
    return NextResponse.json<Err>({ message: errMsg(e) }, { status: 500 });
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