// app/api/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover", // ✅ Use a valid API version (not "clover")
});

export async function POST(req: Request) {
  try {
    const { orderId }: { orderId: string } = await req.json();
    // ✅ Lookup your order in the DB here
    // const order = await Order.findById(orderId).lean();
    // if (!order) throw new Error("Order not found");

    // For now, hardcode amount for testing
    const amount = 39521; // e.g., 395.21 * 100 cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      description: `Payment for order ${orderId}`,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: unknown) {
    // ✅ Type-safe error handling (no "any")
    console.error("Stripe error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown Stripe error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}