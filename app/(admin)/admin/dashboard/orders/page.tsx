// app/(admin)/admin/dashboard/orders/page.tsx
import React from "react";
import Layout from "@/components/admin/layout";
import {CollapsibleTable} from "@/components/admin/orders/table";
import { connectDb } from "@/utils/db";
import Order from "@/models/Order";
import User from "@/models/User";
import type { AdminOrderVM } from "@/types/admin/orders";

// Narrow lean shapes read from Mongo for mapping only.
type Shipping = AdminOrderVM["shippingAddress"];

interface LeanUser {
  _id?: unknown;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ProductLineLean {
  _id?: unknown;
  image?: string;
  name?: string;
  size?: string;
  qty?: number;
  price?: number;
}

interface OrderLean {
  _id?: unknown;
  user?: LeanUser | null;
  total?: number;
  totalPrice?: number;
  isPaid?: boolean;
  status?: string;
  paymentMethod?: string;
  couponApplied?: boolean | string;
  couponCode?: string | null;
  shippingAddress?: Shipping;
  products?: ProductLineLean[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

function pickCouponCode(doc: OrderLean): string | null {
  return (
    doc?.couponCode ??
    (typeof doc?.couponApplied === "string" ? doc.couponApplied : null) ??
    null
  );
}

function toAdminOrderVM(doc: OrderLean): AdminOrderVM {
  return {
    _id: String(doc?._id),
    user: doc?.user
      ? {
          _id: String(doc.user._id ?? ""),
          name: doc.user.name ?? null,
          email: doc.user.email ?? null,
          image: doc.user.image ?? null,
        }
      : null,
    total:
      typeof doc?.total === "number"
        ? doc.total
        : typeof doc?.totalPrice === "number"
        ? doc.totalPrice
        : null,
    isPaid: typeof doc?.isPaid === "boolean" ? doc.isPaid : null,
    status: doc?.status ?? null,

    // ✅ this is the important part
    paymentMethod: doc?.paymentMethod ?? null,

    // coupon display in table
    couponCode: pickCouponCode(doc),
    couponApplied:
      typeof doc?.couponApplied === "boolean"
        ? doc.couponApplied
        : !!pickCouponCode(doc),

    // optional expansions used by the collapsible section
    shippingAddress: doc?.shippingAddress ?? null,
    products: Array.isArray(doc?.products)
      ? doc.products.map((p: ProductLineLean) => ({
          _id: String(p?._id ?? crypto.randomUUID()),
          image: p?.image,
          name: p?.name,
          size: p?.size,
          qty: p?.qty,
          price: p?.price,
        }))
      : null,

    createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export default async function AdminOrdersPage() {
  await connectDb();

  const raw = await Order.find({})
    .populate({ path: "user", model: User, select: "name email image" })
    .sort({ createdAt: -1 })
    .lean();

  const orders: AdminOrderVM[] = (raw ?? []).map(toAdminOrderVM);

  return (
    <Layout>
      <CollapsibleTable rows={orders} />
    </Layout>
  );
}