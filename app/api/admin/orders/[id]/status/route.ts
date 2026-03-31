import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/utils/db";
import Order, { type OrderStatus } from "@/models/Order";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

const ALLOWED_STATUSES: OrderStatus[] = [
  "Not Processed",
  "Processing",
  "Dispatched",
  "Cancelled",
  "Completed",
];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await connectDb();

    const authHeader = req.headers.get("authorization");

    if (!ADMIN_SECRET) {
      console.error("ADMIN_SECRET is not set in environment variables.");
      return NextResponse.json(
        { message: "Server configuration error." },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = (await req.json().catch(() => null)) as { status?: string } | null;
    const nextStatus = body?.status;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid order id." },
        { status: 400 }
      );
    }

    if (!nextStatus || !ALLOWED_STATUSES.includes(nextStatus as OrderStatus)) {
      return NextResponse.json(
        { message: "Invalid order status." },
        { status: 400 }
      );
    }

    const update: {
      status: OrderStatus;
      deliveredAt?: Date;
    } = {
      status: nextStatus as OrderStatus,
    };

    if (nextStatus === "Completed") {
      update.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      id,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Order status updated successfully.",
      status: order.status,
      deliveredAt: order.deliveredAt ?? null,
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id]/status error:", error);
    return NextResponse.json(
      { message: "Failed to update order status." },
      { status: 500 }
    );
  }
}