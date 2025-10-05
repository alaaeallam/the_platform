// app/api/admin/coupons/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { connectDb } from "@/utils/db";
import Coupon from "@/models/Coupon";
import { authOptions } from "@/lib/auth";

/* =========================
   Types
   ========================= */

type Role = "admin" | "customer";

type CouponLean = {
  _id: unknown;
  coupon: string;
  discount: number;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type CouponVM = {
  _id: string;
  coupon: string;
  discount: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiOk<T> = { message?: string } & T;
type ApiErr = { message: string };

/* =========================
   Validation (Zod)
   ========================= */

const CreateSchema = z.object({
  coupon: z.string().min(2).max(40),
  discount: z.number().min(0).max(100),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  coupon: z.string().min(2).max(40),
  discount: z.number().min(0).max(100),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

/* =========================
   Helpers
   ========================= */

function serialize(docs: CouponLean[]): CouponVM[] {
  return docs.map((d) => ({
    _id: String(d._id),
    coupon: d.coupon,
    discount: Number(d.discount),
    startDate: d.startDate ? d.startDate.toISOString() : null,
    endDate: d.endDate ? d.endDate.toISOString() : null,
    createdAt: d.createdAt?.toISOString(),
    updatedAt: d.updatedAt?.toISOString(),
  }));
}

async function assertAdminOrResponse(): Promise<NextResponse<ApiErr> | void> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!session || role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

/* =========================
   GET /api/admin/coupons
   ========================= */
export async function GET() {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    await connectDb();
    const docs = await Coupon.find({})
      .sort({ updatedAt: -1 })
      .lean<CouponLean[]>();

    return NextResponse.json<ApiOk<{ coupons: CouponVM[] }>>(
      { coupons: serialize(docs) },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch coupons.";
    return NextResponse.json<ApiErr>({ message }, { status: 500 });
  }
}

/* =========================
   POST /api/admin/coupons
   body: { coupon, discount, startDate?, endDate? }
   ========================= */
export async function POST(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const parsed = CreateSchema.parse(await req.json());
    await connectDb();

    const exists = await Coupon.findOne({ coupon: parsed.coupon }).lean();
    if (exists) {
      return NextResponse.json<ApiErr>(
        { message: "Coupon already exists. Try a different code." },
        { status: 400 }
      );
    }

    await Coupon.create({
      coupon: parsed.coupon,
      discount: parsed.discount,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
    });

    const docs = await Coupon.find({}).sort({ updatedAt: -1 }).lean<CouponLean[]>();
    return NextResponse.json<ApiOk<{ coupons: CouponVM[] }>>(
      {
        message: `Coupon "${parsed.coupon}" has been created successfully.`,
        coupons: serialize(docs),
      },
      { status: 201 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to create coupon.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* =========================
   PUT /api/admin/coupons
   body: { id, coupon, discount, startDate?, endDate? }
   ========================= */
export async function PUT(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const parsed = UpdateSchema.parse(await req.json());
    await connectDb();

    await Coupon.findByIdAndUpdate(parsed.id, {
      coupon: parsed.coupon,
      discount: parsed.discount,
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
    });

    const docs = await Coupon.find({}).sort({ updatedAt: -1 }).lean<CouponLean[]>();
    return NextResponse.json<ApiOk<{ coupons: CouponVM[] }>>(
      {
        message: "Coupon has been updated successfully.",
        coupons: serialize(docs),
      },
      { status: 200 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to update coupon.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* =========================
   DELETE /api/admin/coupons
   body: { id }
   ========================= */
export async function DELETE(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const { id } = DeleteSchema.parse(await req.json());
    await connectDb();
    await Coupon.findByIdAndDelete(id);

    const docs = await Coupon.find({}).sort({ updatedAt: -1 }).lean<CouponLean[]>();
    return NextResponse.json<ApiOk<{ coupons: CouponVM[] }>>(
      {
        message: "Coupon has been deleted successfully.",
        coupons: serialize(docs),
      },
      { status: 200 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to delete coupon.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}