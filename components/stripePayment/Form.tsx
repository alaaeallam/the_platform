"use client";

import * as React from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import axios from "axios";
import styles from "./styles.module.scss";

type Props = {
  total: number;
  orderId: string;
  onSuccess?: () => void;
};

const CARD_OPTIONS: StripeCardElementOptions = {
  iconStyle: "solid",
  style: {
    base: {
      fontSmoothing: "antialiased",
    },
    invalid: {
      iconColor: "#fd010169",
      color: "#fd010169",
    },
  },
};

export default function Form({ total, orderId, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!stripe || !elements) return; // Stripe.js not loaded yet

    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Payment form not ready. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });

      if (pmError || !paymentMethod) {
        setError(pmError?.message ?? "Unable to create payment method.");
        setSubmitting(false);
        return;
      }

      // Call your backend to charge / confirm
      const res = await axios.post(`/api/order/${orderId}/payWithStripe`, {
        amount: total,
        id: paymentMethod.id,
      });

      if (res.data?.success) {
        onSuccess?.();
        // Often you’d refetch the order or navigate:
        // router.refresh() / window.location.reload()
        window.location.reload();
      } else {
        setError(res.data?.message ?? "Payment failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.stripe}>
      <form onSubmit={handleSubmit}>
        <CardElement options={CARD_OPTIONS} />
        <button type="submit" disabled={!stripe || submitting}>
          {submitting ? "Processing…" : "Pay"}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </form>
    </div>
  );
}