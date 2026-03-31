import type { Metadata } from "next";
import { connectDb } from "@/utils/db";
import Coupon from "@/models/Coupon";
import CouponsClient from "./CouponsClient";
import { JSX } from "react";

export const metadata: Metadata = {
  title: "Coupons | Admin Dashboard",
};

export const dynamic = "force-dynamic";

type CouponRow = {
  _id: unknown;
  coupon?: string | null;
  code?: string | null;
  discount?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  isActive?: boolean | null;
  isFeatured?: boolean | null;
  usageLimit?: number | null;
  usedCount?: number | null;
  description?: string | null;
  href?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export interface CouponVM {
  _id: string;
  coupon: string;
  discount: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  usageLimit?: number | null;
  usedCount?: number | null;
  description?: string | null;
  href?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function toIso(value?: Date | string | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function loadCoupons(): Promise<CouponVM[]> {
  await connectDb();

  const rows = await Coupon.find({})
    .sort({ updatedAt: -1 })
    .lean<CouponRow[]>();

  return rows.map((c) => ({
    _id: String(c._id),
    coupon: String(c.coupon ?? c.code ?? ""),
    discount: Number(c.discount ?? 0),
    startDate: toIso(c.startDate),
    endDate: toIso(c.endDate),
    isActive: Boolean(c.isActive ?? true),
    isFeatured: Boolean(c.isFeatured ?? false),
    usageLimit: c.usageLimit ?? null,
    usedCount: c.usedCount ?? 0,
    description: c.description?.trim() || null,
    href: c.href?.trim() || null,
    createdAt: toIso(c.createdAt) ?? undefined,
    updatedAt: toIso(c.updatedAt) ?? undefined,
  }));
}

export default async function CouponsPage(): Promise<JSX.Element> {
  const coupons = await loadCoupons();
  return <CouponsClient initialCoupons={coupons} />;
}