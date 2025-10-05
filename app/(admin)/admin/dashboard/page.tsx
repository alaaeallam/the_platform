// app/(admin)/admin/dashboard/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/utils/db";
import DashboardClient, { type DashboardProps } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Shoppay - Admin Dashboard",
};

export const dynamic = "force-dynamic";

/* ---------- Lean doc types (what we read from Mongo) ---------- */
type IdLike = unknown;

type UserLean = {
  _id: IdLike;
  name?: string;
  email?: string;
  image?: string | null;
};

type OrderLean = {
  _id: IdLike;
  total?: number | string;
  isPaid?: boolean;
  status?: DashboardProps["orders"][number]["status"] | string | null;
  user?: { _id?: IdLike; name?: string } | null;
};

type ProductLean = { _id: IdLike };

/* ---------- Helpers ---------- */
const toNumber = (v: number | string | undefined): number =>
  typeof v === "number" ? v : Number(String(v ?? "0")) || 0;

const toStatus = (
  s: OrderLean["status"]
): DashboardProps["orders"][number]["status"] => {
  const v = String(s ?? "");
  return v === "Processing" ||
    v === "Dispatched" ||
    v === "Cancelled" ||
    v === "Completed"
    ? v
    : "Not Processed";
};

/* ---------- Data fetch ---------- */
async function getData(): Promise<DashboardProps> {
  await connectDb();

  const usersRaw = await User.find().select("name email image").lean<UserLean[]>();
  const ordersRaw = await Order.find()
    .populate({ path: "user", model: User, select: "name" })
    .select("total isPaid status user")
    .lean<OrderLean[]>();
  const productsRaw = await Product.find().select("_id").lean<ProductLean[]>();

  const users: DashboardProps["users"] = (usersRaw ?? []).map((u) => ({
    _id: String(u._id),
    name: u.name ?? "",
    email: u.email ?? "",
    image: u.image ?? undefined,
  }));

  const orders: DashboardProps["orders"] = (ordersRaw ?? []).map((o) => ({
    _id: String(o._id),
    total: toNumber(o.total),
    isPaid: Boolean(o.isPaid),
    status: toStatus(o.status),
    user: {
      _id: String(o.user?._id ?? ""),
      name: String(o.user?.name ?? "Unknown"),
    },
  }));

  const products: DashboardProps["products"] = (productsRaw ?? []).map((p) => ({
    _id: String(p._id),
  }));

  return { users, orders, products };
}

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const data = await getData();
  return <DashboardClient {...data} />;
}