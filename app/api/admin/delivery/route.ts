import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/utils/db";
import DeliveryRule from "@/models/DeliveryRule";

type CreateDeliveryBody = {
  countryCode?: string;
  countryName?: string;
  fee?: number | string;
  currency?: string;
  freeShippingThreshold?: number | string | null;
  estimatedDaysMin?: number | string;
  estimatedDaysMax?: number | string;
  isActive?: boolean;
};

function normalizeBody(body: CreateDeliveryBody) {
  const countryCode = String(body.countryCode ?? "").trim().toUpperCase();
  const countryName = String(body.countryName ?? "").trim();
  const currency = String(body.currency ?? "").trim().toUpperCase();

  const fee = Number(body.fee);
  const estimatedDaysMin = Number(body.estimatedDaysMin ?? 1);
  const estimatedDaysMax = Number(body.estimatedDaysMax ?? 3);

  const freeShippingThreshold =
    body.freeShippingThreshold === null ||
    body.freeShippingThreshold === undefined ||
    body.freeShippingThreshold === ""
      ? null
      : Number(body.freeShippingThreshold);

  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;

  return {
    countryCode,
    countryName,
    fee,
    currency,
    freeShippingThreshold,
    estimatedDaysMin,
    estimatedDaysMax,
    isActive,
  };
}

function validatePayload(payload: ReturnType<typeof normalizeBody>) {
  if (!payload.countryCode) return "countryCode is required";
  if (!payload.countryName) return "countryName is required";
  if (!payload.currency) return "currency is required";

  if (!Number.isFinite(payload.fee) || payload.fee < 0) {
    return "fee must be a number greater than or equal to 0";
  }

  if (
    payload.freeShippingThreshold !== null &&
    (!Number.isFinite(payload.freeShippingThreshold) ||
      payload.freeShippingThreshold < 0)
  ) {
    return "freeShippingThreshold must be null or a number greater than or equal to 0";
  }

  if (!Number.isFinite(payload.estimatedDaysMin) || payload.estimatedDaysMin < 0) {
    return "estimatedDaysMin must be a number greater than or equal to 0";
  }

  if (!Number.isFinite(payload.estimatedDaysMax) || payload.estimatedDaysMax < 0) {
    return "estimatedDaysMax must be a number greater than or equal to 0";
  }

  if (payload.estimatedDaysMax < payload.estimatedDaysMin) {
    return "estimatedDaysMax must be greater than or equal to estimatedDaysMin";
  }

  return null;
}

export async function GET() {
  try {
    await connectDb();

    const rules = await DeliveryRule.find({})
      .sort({ countryName: 1 })
      .lean();

    return NextResponse.json(
      { ok: true, rules },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/delivery error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch delivery rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const body = (await req.json()) as CreateDeliveryBody;
    const payload = normalizeBody(body);

    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json(
        { ok: false, message: validationError },
        { status: 400 }
      );
    }

    const exists = await DeliveryRule.findOne({
      countryCode: payload.countryCode,
    }).lean();

    if (exists) {
      return NextResponse.json(
        { ok: false, message: "A delivery rule for this country already exists" },
        { status: 409 }
      );
    }

    const created = await DeliveryRule.create(payload);

    return NextResponse.json(
      { ok: true, rule: created, message: "Delivery rule created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/delivery error:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { ok: false, message: "A delivery rule for this country already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Failed to create delivery rule" },
      { status: 500 }
    );
  }
}