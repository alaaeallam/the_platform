"use client";
import * as React from "react";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import styles from "./styles.module.scss";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export type InlineStripeHandle = { confirm: () => Promise<string> };
const InlineStripeForm = React.forwardRef<InlineStripeHandle, { amountCents: number }>(
  function InlineStripeForm({ amountCents }, ref) {
    const [clientSecret, setClientSecret] = React.useState<string | null>(null);

    React.useEffect(() => {
      (async () => {
        try {
          const res = await fetch("/api/stripe/intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amountCents }),
          });
          const data = await res.json();
          setClientSecret(data.clientSecret);
        } catch (e) {
          console.error("Failed to init Stripe intent", e);
        }
      })();
    }, [amountCents]);

    const ConfirmInner = () => {
      const stripe = useStripe();
      const elements = useElements();

      React.useImperativeHandle(ref, () => ({
        async confirm() {
          if (!stripe || !elements) throw new Error("Payment form not ready");
          const card = elements.getElement(CardElement);
          if (!card) throw new Error("Card element not found");
          if (!clientSecret) throw new Error("Missing client secret");

          const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card },
          });

          if (error) throw new Error(error.message || "Payment failed");
          if (!paymentIntent || paymentIntent.status !== "succeeded") {
            throw new Error("Payment not completed");
          }
          return paymentIntent.id;
        },
      }));

      return (
        <div className={styles.inlineStripeBox}>
          <label className={styles.inlineStripeLabel}>Card number</label>
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      );
    };

    if (!clientSecret) return <p>Loading payment…</p>;

    const options: StripeElementsOptions = { clientSecret };

    return (
      <Elements stripe={stripePromise} options={options} key={clientSecret}>
        <ConfirmInner />
      </Elements>
    );
  }
);

export default InlineStripeForm;