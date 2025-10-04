// app/api/stripe/intent/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

// ✅ Use a real, current API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    // We expect { amountCents } from the client Summary component
    const amountCents: number | undefined =
      typeof body.amountCents === "number"
        ? Math.round(body.amountCents)
        : typeof body?.cart === "object" &&
          typeof (body.cart as { cartTotal?: number }).cartTotal === "number"
        ? Math.round((body.cart as { cartTotal: number }).cartTotal * 100)
        : undefined;

    if (!Number.isFinite(amountCents) || amountCents! < 50) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const pi = await stripe.paymentIntents.create({
      amount: amountCents!,
      currency: "usd",
      description: "Checkout payment",
      // If you switch to PaymentElement later:
      // automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("intent error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}