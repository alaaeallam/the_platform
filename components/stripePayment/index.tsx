"use client";

import * as React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js";
import Form from "./Form";

type StripePaymentProps = {
  stripePublicKey: string;
  total: number;
  orderId: string;
  onSuccess?: () => void;
};

// ✅ Cache should store the *return type of loadStripe*, not a Promise of it
const stripePromiseCache = new Map<string, ReturnType<typeof loadStripe>>();

function getStripe(pk: string): ReturnType<typeof loadStripe> {
  if (!stripePromiseCache.has(pk)) {
    stripePromiseCache.set(pk, loadStripe(pk));
  }
  // non-null because we just set it if missing
  return stripePromiseCache.get(pk)!;
}

export default function StripePayment({
  stripePublicKey,
  total,
  orderId,
  onSuccess,
}: StripePaymentProps) {
  const options: StripeElementsOptions = {
    appearance: { theme: "stripe" },
  };

  return (
    <Elements stripe={getStripe(stripePublicKey)} options={options}>
      <Form total={total} orderId={orderId} onSuccess={onSuccess} />
    </Elements>
  );
}