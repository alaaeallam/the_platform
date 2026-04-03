import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { connectDb } from "@/utils/db";
import Order, { type OrderStatus } from "@/models/Order";
import { authOptions } from "@/lib/auth";

const ALLOWED_STATUSES: OrderStatus[] = [
  "Not Processed",
  "Processing",
  "Dispatched",
  "Cancelled",
  "Completed",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    await connectDb();

    const { id } = await params;
    const body = (await req.json().catch(() => null)) as { status?: string } | null;
    const nextStatus = body?.status;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid order id." }, { status: 400 });
    }

    if (!nextStatus || !ALLOWED_STATUSES.includes(nextStatus as OrderStatus)) {
      return NextResponse.json({ message: "Invalid order status." }, { status: 400 });
    }

    const update: {
      status: OrderStatus;
      deliveredAt?: Date | null;
    } = {
      status: nextStatus as OrderStatus,
    };

    if (nextStatus === "Completed") {
      update.deliveredAt = new Date();
    } else {
      update.deliveredAt = null;
    }

    const order = await Order.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Order status updated successfully.",
      status: order.status,
      deliveredAt: order.deliveredAt ?? null,
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id]/status error:", {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { message: "Failed to update order status." },
      { status: 500 }
    );
  }
}