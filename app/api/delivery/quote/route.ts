

import { NextRequest, NextResponse } from "next/server";
import { calculateDelivery } from "@/lib/delivery/calculateDelivery";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const countryCode = String(searchParams.get("countryCode") || "")
      .trim()
      .toUpperCase();

    const subtotalRaw = searchParams.get("subtotal");
    const subtotal = Number(subtotalRaw);

    if (!countryCode) {
      return NextResponse.json(
        { ok: false, message: "countryCode is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { ok: false, message: "subtotal must be a valid number" },
        { status: 400 }
      );
    }

    const delivery = await calculateDelivery({
      countryCode,
      subtotal,
    });

    return NextResponse.json(
      {
        ok: true,
        delivery: {
          ...delivery,
          currency: "USD",
        },
        preview: {
          fee: delivery.fee,
          freeShippingApplied: delivery.freeShippingApplied,
          eta: `${delivery.estimatedDaysMin}-${delivery.estimatedDaysMax}`,
          currency: "USD",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Delivery is not available for this country",
      },
      { status: 400 }
    );
  }
}