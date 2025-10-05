// app/(admin)/admin/dashboard/coupons/page.tsx
import type { Metadata } from "next";
import { connectDb } from "@/utils/db";
import Coupon from "@/models/Coupon";
import CouponsClient from "./CouponsClient";
import { JSX } from "react";

export const metadata: Metadata = {
  title: "Coupons | Admin Dashboard",
};

export const dynamic = "force-dynamic";

/** UI shape used by client components */
type CouponRow = {
  _id: unknown;
  coupon: string;
  discount: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export interface CouponVM {
  _id: string;
  coupon: string;
  discount: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
function toIso(value?: Date | string | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
// Server function (runs on the server only)
async function loadCoupons(): Promise<CouponVM[]> {
  await connectDb();

  const rows = await Coupon.find({})
    .sort({ updatedAt: -1 })
    .lean<CouponRow[]>();

   return rows.map((c) => ({
    _id: String(c._id),
    coupon: c.coupon,
    discount: c.discount,
    startDate: toIso(c.startDate),
    endDate: toIso(c.endDate),
    createdAt: toIso(c.createdAt) ?? undefined,
    updatedAt: toIso(c.updatedAt) ?? undefined,
  }));

}

export default async function CouponsPage(): Promise<JSX.Element> {
  const coupons = await loadCoupons();
  return <CouponsClient initialCoupons={coupons} />;
}