import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { connectDb } from "@/utils/db";
import Order from "@/models/Order";
import { authOptions } from "@/lib/auth";

type PaymentStatus = "paid" | "unpaid";

const ALLOWED_PAYMENT_STATUSES: PaymentStatus[] = ["paid", "unpaid"];

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
    const body = (await req.json().catch(() => null)) as
      | { paymentStatus?: string }
      | null;

    const nextPaymentStatus = body?.paymentStatus;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid order id." }, { status: 400 });
    }

    if (
      !nextPaymentStatus ||
      !ALLOWED_PAYMENT_STATUSES.includes(nextPaymentStatus as PaymentStatus)
    ) {
      return NextResponse.json(
        { message: "Invalid payment status." },
        { status: 400 }
      );
    }

    const update: {
      isPaid: boolean;
      paidAt?: Date | null;
    } = {
      isPaid: nextPaymentStatus === "paid",
    };

    if (nextPaymentStatus === "paid") {
      update.paidAt = new Date();
    } else {
      update.paidAt = null;
    }

    const order = await Order.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Payment status updated successfully.",
      isPaid: order.isPaid,
      paidAt: order.paidAt ?? null,
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id]/payment error:", {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { message: "Failed to update payment status." },
      { status: 500 }
    );
  }
}