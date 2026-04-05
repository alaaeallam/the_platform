import { NextResponse } from "next/server";
import { connectDb } from "@/utils/db";
import Coupon from "@/models/Coupon";
export const revalidate = 60;
type CouponDoc = {
  coupon?: string | null;
  code?: string | null;
  discount?: number | null;
  description?: string | null;
  href?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

function isCouponWithinDateWindow(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  now: Date = new Date()
): boolean {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && Number.isNaN(start.getTime())) return false;
  if (end && Number.isNaN(end.getTime())) return false;

  if (start && start > now) return false;
  if (end && end < now) return false;

  return true;
}

function serializeCoupon(coupon: CouponDoc) {
  return {
    code: coupon.coupon || coupon.code || "",
    discountPercent: coupon.discount ?? 0,
    description: coupon.description ?? null,
    href: coupon.href ?? null,
  };
}

export async function GET() {
  try {
    await connectDb();

    const now = new Date();

    const featuredCoupons = await Coupon.find({
      isFeatured: true,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .lean<CouponDoc[]>();

    const featuredCoupon = featuredCoupons.find((coupon) =>
      isCouponWithinDateWindow(coupon.startDate, coupon.endDate, now)
    );

    if (featuredCoupon) {
      return NextResponse.json(serializeCoupon(featuredCoupon));
    }

    const activeCoupons = await Coupon.find({
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .lean<CouponDoc[]>();

    const fallbackCoupon = activeCoupons.find((coupon) =>
      isCouponWithinDateWindow(coupon.startDate, coupon.endDate, now)
    );

    if (!fallbackCoupon) {
      return NextResponse.json(null);
    }

    return NextResponse.json(serializeCoupon(fallbackCoupon));
  } catch {
    return NextResponse.json(null);
  }
}