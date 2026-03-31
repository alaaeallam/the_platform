import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDb } from "@/utils/db";
import Coupon from "@/models/Coupon";
import { authOptions } from "@/lib/auth";

type Role = "admin" | "customer";
type CouponLean = {
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
async function assertAdminOrResponse() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;

  if (!session || role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

function toIso(value?: Date | string | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const { id } = await params;
    await connectDb();

    const target = await Coupon.findById(id);
    if (!target) {
      return NextResponse.json({ message: "Coupon not found." }, { status: 404 });
    }

    await Coupon.updateMany({}, { $set: { isFeatured: false } });
    await Coupon.findByIdAndUpdate(id, {
      $set: { isFeatured: true, isActive: true },
    });

    const docs = await Coupon.find({}).sort({ updatedAt: -1 }).lean<CouponLean[]>();

    return NextResponse.json({
      message: "Featured coupon updated successfully.",
      coupons: docs.map((d) => ({
        _id: String(d._id),
        coupon: String(d.coupon ?? d.code ?? ""),
        discount: Number(d.discount ?? 0),
        startDate: toIso(d.startDate),
        endDate: toIso(d.endDate),
        isActive: Boolean(d.isActive ?? true),
        isFeatured: Boolean(d.isFeatured ?? false),
        usageLimit: d.usageLimit ?? null,
        usedCount: d.usedCount ?? 0,
        description: d.description?.trim() || null,
        href: d.href?.trim() || null,
        createdAt: toIso(d.createdAt),
        updatedAt: toIso(d.updatedAt),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to feature coupon.";
    return NextResponse.json({ message }, { status: 400 });
  }
}