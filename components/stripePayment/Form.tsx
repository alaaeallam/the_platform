//components/stripePayment/Form.tsx
"use client";

import * as React from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

type Props = { clientSecret: string; orderId: string; onSuccess?: () => void };

export default function Form({ clientSecret, orderId, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card }, // optionally add billing_details
      // If you want a full redirect/return_url flow, add confirmParams here
    });

    setSubmitting(false);

    if (error) {
      setError(error.message || "Payment failed");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess?.();
      // Optionally: call your server to mark the order as paid
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || submitting}>{submitting ? "Processing…" : "Pay"}</button>
      {error && <div>{error}</div>}
    </form>
  );
}