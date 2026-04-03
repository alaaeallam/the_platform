import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/utils/db";
import DeliveryRule from "@/models/DeliveryRule";

type UpdateDeliveryBody = {
  countryCode?: string;
  countryName?: string;
  fee?: number | string;
  currency?: string;
  freeShippingThreshold?: number | string | null;
  estimatedDaysMin?: number | string;
  estimatedDaysMax?: number | string;
  isActive?: boolean;
};

function normalizeBody(body: UpdateDeliveryBody) {
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await connectDb();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid delivery rule id" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as UpdateDeliveryBody;
    const payload = normalizeBody(body);

    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json(
        { ok: false, message: validationError },
        { status: 400 }
      );
    }

    const duplicate = await DeliveryRule.findOne({
      countryCode: payload.countryCode,
      _id: { $ne: id },
    }).lean();

    if (duplicate) {
      return NextResponse.json(
        { ok: false, message: "Another delivery rule already uses this country code" },
        { status: 409 }
      );
    }

    const updated = await DeliveryRule.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "Delivery rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, rule: updated, message: "Delivery rule updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PUT /api/admin/delivery/[id] error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000
    ) {
      return NextResponse.json(
        { ok: false, message: "Another delivery rule already uses this country code" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Failed to update delivery rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDb();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid delivery rule id" },
        { status: 400 }
      );
    }

    const deleted = await DeliveryRule.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { ok: false, message: "Delivery rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, message: "Delivery rule deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/admin/delivery/[id] error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to delete delivery rule" },
      { status: 500 }
    );
  }
}