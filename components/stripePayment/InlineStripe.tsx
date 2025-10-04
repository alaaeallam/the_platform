"use client";

import * as React from "react";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ---- augment Window so we can attach a function without `any`
declare global {
  interface Window {
    __confirmStripePayment?: () => Promise<string>;
  }
}

type Props = {
  // used to create the PaymentIntent on the server
  cartTotal: number;
  // lets the parent know we've obtained a clientSecret
  onReady: (ctx: { clientSecret: string }) => void;
  onConfirmRequested?: () => void; // (kept for compatibility; not used here)
};

export default function InlineStripe({ cartTotal, onReady }: Props) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/stripe/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(cartTotal * 100) }),
      });

      const data: { clientSecret?: string; paymentIntentId?: string; error?: string } =
        await res.json();

      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      setClientSecret(data.clientSecret);
      onReady?.({ clientSecret: data.clientSecret });
    })().catch((e) => {
      // optional: surface this to the parent UI
      console.error("Stripe init error:", e);
    });
  }, [cartTotal, onReady]);

  if (!clientSecret) return <p>Loading payment…</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }} key={clientSecret}>
      <ConfirmButton clientSecret={clientSecret} />
    </Elements>
  );
}

function ConfirmButton({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

  // Expose a callable confirm function via window (typed, no `any`)
  React.useEffect(() => {
    window.__confirmStripePayment = async () => {
      if (!stripe || !elements) throw new Error("Stripe is not ready");

      const card = elements.getElement(CardElement);
      if (!card) throw new Error("CardElement is missing");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (error) throw new Error(error.message || "Payment failed");
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        throw new Error("Payment not completed");
      }
      return paymentIntent.id;
    };

    // cleanup on unmount
    return () => {
      delete window.__confirmStripePayment;
    };
  }, [stripe, elements, clientSecret]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label style={{ fontWeight: 600 }}>Complete your payment</label>
      <CardElement />
      {/* Parent triggers window.__confirmStripePayment() on "Place Order" */}
    </div>
  );
}