// app/api/admin/coupons/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { startOfDay, endOfDay } from "date-fns";
import { connectDb } from "@/utils/db";
import Coupon from "@/models/Coupon";
import { authOptions } from "@/lib/auth";

/* ============ Types ============ */

type Role = "admin" | "customer";

type CouponLean = {
  _id: unknown;
  coupon: string;
  discount: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type CouponVM = {
  _id: string;
  coupon: string;
  discount: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ApiOk<T> = { message?: string } & T;
type ApiErr = { message: string };

/* ============ Date helpers ============ */

// Accept Date, ISO string, or "dd/MM/yyyy" and return Date | null | undefined
function parseMaybeDate(input: unknown): Date | null | undefined {
  if (input === undefined || input === null || input === "") return undefined;

  if (input instanceof Date) return isNaN(input.getTime()) ? undefined : input;

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return undefined;

    // Try native ISO/RFC parsing first
    const iso = new Date(s);
    if (!isNaN(iso.getTime())) return iso;

    // Try dd/MM/yyyy
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return undefined;
}

// Safe ISO output when value can be Date | string | null | undefined
function toIso(value?: Date | string | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/* ============ Validation (Zod) ============ */

// Reusable schema that coerces supported date inputs -> Date | null | undefined
const DateInput = z
  .preprocess((v) => parseMaybeDate(v), z.date().optional().nullable());

const CreateSchema = z.object({
  coupon: z.string().min(2).max(40),
  discount: z.number().min(0).max(100),
  startDate: DateInput,
  endDate: DateInput,
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  coupon: z.string().min(2).max(40),
  discount: z.number().min(0).max(100),
  startDate: DateInput,
  endDate: DateInput,
});

const DeleteSchema = z.object({ id: z.string().min(1) });

/* ============ Helpers ============ */

function serialize(docs: CouponLean[]): CouponVM[] {
  return docs.map((d) => ({
    _id: String(d._id),
    coupon: d.coupon,
    discount: Number(d.discount),
    startDate: toIso(d.startDate) ?? null,
    endDate: toIso(d.endDate) ?? null,
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  }));
}

async function assertAdminOrResponse(): Promise<NextResponse<ApiErr> | void> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!session || role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

/* ============ GET ============ */
export async function GET() {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    await connectDb();
    const docs = await Coupon.find({}).sort({ updatedAt: -1 }).lean<CouponLean[]>();

    return NextResponse.json<ApiOk<{ coupons: CouponVM[] }>>(
      { coupons: serialize(docs) },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch coupons.";
    return NextResponse.json<ApiErr>({ message }, { status: 500 });
  }
}

/* ============ POST ============ */
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
    const start = parsed.startDate ? startOfDay(new Date(parsed.startDate)) : undefined;
const end   = parsed.endDate   ? endOfDay(new Date(parsed.endDate))   : undefined;
await Coupon.create({
  coupon: parsed.coupon,
  discount: parsed.discount,
  startDate: start,
  endDate: end,
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
      e instanceof z.ZodError
        ? e.issues[0]?.message ?? "Invalid input."
        : e instanceof Error
        ? e.message
        : "Failed to create coupon.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* ============ PUT ============ */
export async function PUT(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const parsed = UpdateSchema.parse(await req.json());
    await connectDb();

    await Coupon.findByIdAndUpdate(parsed.id, {
      coupon: parsed.coupon,
      discount: parsed.discount,
      startDate: parsed.startDate ?? null,
      endDate: parsed.endDate ?? null,
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
      e instanceof z.ZodError
        ? e.issues[0]?.message ?? "Invalid input."
        : e instanceof Error
        ? e.message
        : "Failed to update coupon.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* ============ DELETE ============ */
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
      e instanceof z.ZodError
        ? e.issues[0]?.message ?? "Invalid input."
        : e instanceof Error
        ? e.message
        : "Failed to delete coupon.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}