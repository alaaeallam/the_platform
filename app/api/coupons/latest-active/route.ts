

import { NextResponse } from "next/server";
import { connectDb } from "@/utils/db";
import Coupon from "@/models/Coupon";

export async function GET() {
  try {
    await connectDb();

    const now = new Date();

    const coupon = await Coupon.findOne({
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!coupon) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({
      code: coupon.coupon,
      discountPercent: coupon.discount,
    });
  } catch (error) {
    console.error("Failed to fetch latest active coupon:", error);
    return NextResponse.json(null, { status: 200 });
  }
}