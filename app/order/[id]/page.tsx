//app/(shop)/order/[id]/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import db from "@/utils/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { Types } from "mongoose";
import OrderClient from "@/components/order/OrderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Shape expected by the client component
export type OrderLine = {
  _id?: string;
  product?: string;
  name: string;
  image: string;
  size?: string;
  qty: number;
  color?: { color?: string; image?: string };
  price?: number;       // legacy
  unitPrice?: number;   // normalized
  unitShipping?: number;
  lineTotal?: number;
  lineShipping?: number;
};
type Address = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};
export type OrderView = {
  _id: string;
  user: { _id?: string; name?: string; email?: string; image?: string };
  products: OrderLine[];
  shippingAddress: Address;
  paymentMethod: "paypal" | "credit_card" | "cash" | (string & {});
  total: number;
  totalBeforeDiscount?: number;
  couponApplied?: string;
  shippingPrice: number;
  taxPrice: number;
  isPaid: boolean;
  status:
    | "Not Processed"
    | "Processing"
    | "Dispatched"
    | "Cancelled"
    | "Completed"
    | (string & {});
};

const toNum = (v: unknown, fb = 0) => (Number.isFinite(Number(v)) ? Number(v) : fb);

type PageProps = { params: Promise<{ id: string }> };
export default async function OrderPage({ params }: PageProps) {
  const { id } = await params; // Next 15: params is a Promise
  if (!id || !Types.ObjectId.isValid(id)) redirect("/cart");

  await db.connectDb();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/order/${id}`)}`);
    }

    // Resolve current user (by id if valid ObjectId, else by email)
    const byId = session.user.id && Types.ObjectId.isValid(session.user.id)
      ? session.user.id
      : null;
    const userDoc = (byId
      ? await User.findById(byId).lean<Record<string, unknown>>()
      : session.user.email
      ? await User.findOne({ email: session.user.email }).lean<Record<string, unknown>>()
      : null) as Record<string, unknown> | null;

    if (!userDoc?._id) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/order/${id}`)}`);
    }

    // Only allow owner to view
    const orderDoc = await Order.findOne({ _id: id, user: userDoc._id })
      .populate<{ user: { _id?: string; name?: string; email?: string; image?: string } }>({ path: "user", model: User, select: "name email image" })
      .lean<{
        _id: Types.ObjectId | string;
        user?: { _id?: Types.ObjectId | string; name?: string; email?: string; image?: string };
        items?: unknown[];
        products?: unknown[];
        subtotal?: unknown;
        shipping?: unknown;
        shippingPrice?: unknown;
        taxPrice?: unknown;
        total?: unknown;
        totalBeforeDiscount?: unknown;
        couponApplied?: unknown;
        shippingAddress?: unknown;
        paymentMethod?: unknown;
        isPaid?: unknown;
        status?: unknown;
      }>();

    if (!orderDoc) redirect("/cart");
const sa = (orderDoc.shippingAddress ?? {}) as Partial<Address>;
const shippingAddress: Address = {
  firstName: String(sa.firstName ?? ""),
  lastName:  String(sa.lastName  ?? ""),
  phoneNumber: sa.phoneNumber ? String(sa.phoneNumber) : undefined,
  address1:  String(sa.address1  ?? ""),
  address2:  sa.address2 ? String(sa.address2) : undefined,
  city:      String(sa.city      ?? ""),
  state:     String(sa.state     ?? ""),
  zipCode:   String(sa.zipCode   ?? ""),
  country:   String(sa.country   ?? ""),
};
    // Map lines (supports both `items` and legacy `products` on the order)
    const lines: OrderLine[] = Array.isArray(orderDoc.items)
      ? orderDoc.items.map((i) => {
          const item = i as Record<string, unknown>;
          return {
            _id: String(item._id ?? ""),
            product: item.product ? String(item.product) : undefined,
            name: typeof item.name === "string" ? item.name : "",
            image: typeof item.image === "string" ? item.image : "",
            size: typeof item.size === "string" ? item.size : undefined,
            qty: toNum(item.qty, 0),
            color: item.color ? { color: (item.color as { color?: string }).color, image: (item.color as { image?: string }).image } : undefined,
            unitPrice: toNum(item.unitPrice, toNum(item.price)),
            unitShipping: toNum(item.unitShipping),
            lineTotal: toNum(item.lineTotal, toNum(item.unitPrice, toNum(item.price)) * toNum(item.qty, 0)),
            lineShipping: toNum(item.lineShipping),
          };
        })
      : Array.isArray(orderDoc.products)
      ? orderDoc.products.map((p) => {
          const prod = p as Record<string, unknown>;
          return {
            _id: String(prod._id ?? ""),
            product: prod.product ? String(prod.product) : undefined,
            name: typeof prod.name === "string" ? prod.name : "",
            image: typeof prod.image === "string" ? prod.image : "",
            size: typeof prod.size === "string" ? prod.size : undefined,
            qty: toNum(prod.qty, 0),
            color: prod.color ? { color: (prod.color as { color?: string }).color, image: (prod.color as { image?: string }).image } : undefined,
            price: toNum(prod.price),
            unitPrice: toNum(prod.price),
            unitShipping: 0,
            lineTotal: toNum(prod.price) * toNum(prod.qty, 0),
            lineShipping: 0,
          };
        })
      : [];

    const subtotal = toNum(orderDoc.subtotal, lines.reduce((s, l) => s + toNum(l.lineTotal), 0));
    const shipping = toNum(orderDoc.shipping ?? orderDoc.shippingPrice, lines.reduce((s, l) => s + toNum(l.lineShipping), 0));
    const taxPrice = toNum(orderDoc.taxPrice, 0);
    const total = toNum(orderDoc.total, subtotal + shipping + taxPrice);

const order: OrderView = {
  _id: String(orderDoc._id),
  user: {
    _id: orderDoc.user?._id ? String(orderDoc.user._id) : undefined,
    name: orderDoc.user?.name,
    email: orderDoc.user?.email,
    image: orderDoc.user?.image,
  },
  products: lines,
  shippingAddress,  // ← now typed correctly
  paymentMethod: (orderDoc.paymentMethod as OrderView["paymentMethod"]) || "cash",
  total,
  totalBeforeDiscount: orderDoc.totalBeforeDiscount ? toNum(orderDoc.totalBeforeDiscount) : undefined,
  couponApplied: typeof orderDoc.couponApplied === "string" ? orderDoc.couponApplied : undefined,
  shippingPrice: shipping,
  taxPrice,
  isPaid: !!orderDoc.isPaid,
  status: (orderDoc.status as OrderView["status"]) || "Not Processed",
};

    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

    return (
      <OrderClient
        order={order}
        paypalClientId={paypalClientId}
        stripePublicKey={stripePublicKey}
      />
    );
  } finally {
    await db.disconnectDb();
  }
}
