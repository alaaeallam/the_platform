//components/stripePayment/index.tsx
"use client";

import * as React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import Form from "./Form";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripePayment({ orderId }: { orderId: string }) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      setClientSecret(data.clientSecret);
    })();
  }, [orderId]);

  if (!clientSecret) return <p>Loading payment…</p>;

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: "stripe" },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <Form clientSecret={clientSecret} />
    </Elements>
  );
}