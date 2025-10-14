"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import ShippingInput from "../../inputs/shippingInput";
import { applyCoupon } from "../../../requests/user";
import { useRouter } from "next/navigation";
import DotLoaderSpinner from "@/components/loaders/dotLoader";

import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

import type { Address, UserVM, CartVM, PaymentMethod } from "@/types/checkout";
type CanonicalPM = "STRIPE" | "PAYPAL" | "CASH";

// Only return a canonical value when the user explicitly chose a method.
// Otherwise return null so we don't render the card form prematurely.
function toCanonical(pm: PaymentMethod | null | undefined): CanonicalPM | null {
  if (pm === "paypal") return "PAYPAL";
  if (pm === "cash") return "CASH";
  if (pm === "stripe" || pm === "visa" || pm === "mastercard") return "STRIPE";
  return null; // unknown / not selected yet
}
/* ----------------------------- Types ----------------------------- */
type SummaryProps = {
  totalAfterDiscount: number | "";
  setTotalAfterDiscount: React.Dispatch<React.SetStateAction<number | "">>;
  user: UserVM;
  cart: CartVM;
  paymentMethod: PaymentMethod;
  selectedAddress: Address | null | undefined;
};

const couponSchema = Yup.object({
  coupon: Yup.string().required("Please enter a coupon first!"),
});

/* ----------------------------- Inline Stripe Form ----------------------------- */
type InlineStripeHandle = { confirm: () => Promise<string> };

const InlineStripeForm = React.forwardRef<InlineStripeHandle, { amountCents: number }>(function InlineStripeForm({ amountCents }, ref) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        
        const res = await fetch("/api/stripe/intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amountCents }),   // <— send amountCents, not { cart:{...} }
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
        if (!paymentIntent || paymentIntent.status !== "succeeded") throw new Error("Payment not completed");
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
});

/* ----------------------------- Component ----------------------------- */

export default function Summary({
  totalAfterDiscount,
  setTotalAfterDiscount,
  user,
  cart,
  paymentMethod,
  selectedAddress,
}: SummaryProps): React.JSX.Element {
  const router = useRouter();
  const isStripeSelected = toCanonical(paymentMethod) === "STRIPE";

  const stripeRef = React.useRef<InlineStripeHandle | null>(null);

  const [coupon, setCoupon] = React.useState<string>("");
  const [discount, setDiscount] = React.useState<number>(0);
  const [error, setError] = React.useState<string>("");
  const [orderError, setOrderError] = React.useState<string>("");

  // loaders
  const [posting, setPosting] = React.useState<boolean>(false);      // place order
  const [isApplying, setIsApplying] = React.useState<boolean>(false); // coupon apply/remove

  React.useEffect(() => {
    setOrderError("");
  }, [paymentMethod, selectedAddress]);

  /* ----- Coupon: apply ----- */
  const applyCouponHandler = React.useCallback(async () => {
    setError("");
    setIsApplying(true);
    console.groupCollapsed("%cApply coupon", "color:#888");
    console.log("coupon code →", coupon);
    console.log("cartTotal →", cart.cartTotal);
    const t0 = performance.now();

    try {
      const res = await applyCoupon(coupon);

      console.log("applyCoupon():", (performance.now() - t0).toFixed(3), "ms");
      console.log("API ok? →", res.ok);
    

      if (!res.ok) {
        setError(res.error);
        setDiscount(0);
        setTotalAfterDiscount("");
        return;
      }

      setTotalAfterDiscount(res.data.totalAfterDiscount);
      setDiscount(res.data.discount);
    } catch (e) {
      setError("Something went wrong applying the coupon. Please try again.");
      console.warn(e);
    } finally {
      setIsApplying(false);
      console.groupEnd();
    }
  }, [coupon, cart.cartTotal, setTotalAfterDiscount]);

  /* ----- Coupon: remove ----- */
  const removeCouponHandler = React.useCallback(async () => {
    setIsApplying(true);
    console.groupCollapsed("%cRemove coupon", "color:#888");
    const t0 = performance.now();

    try {
      // Client-side clear
      setDiscount(0);
      setTotalAfterDiscount("");
      setCoupon("");
      setError("");

      // OPTIONAL: if you add a backend endpoint to clear the stored discount on the cart,
      // you can call it here. Leaving it safe/no-op if it doesn't exist.
      // await fetch("/api/user/clearCoupon", { method: "POST" }).catch(() => {});
    } finally {
      console.log("removeCoupon():", (performance.now() - t0).toFixed(3), "ms");
      setIsApplying(false);
      console.groupEnd();
    }
  }, [setTotalAfterDiscount]);

  /* ----- Order handler ----- */
const placeOrderHandler = React.useCallback(async () => {
  setOrderError("");

  if (!paymentMethod) {
    setOrderError("Please choose a payment method.");
    return;
  }
  if (!selectedAddress) {
    setOrderError("Please choose a shipping address.");
    return;
  }

  try {
    const canonical = isStripeSelected ? "STRIPE" : toCanonical(paymentMethod);

    let paymentInfo: { provider: "stripe"; intentId: string } | undefined;
    if (canonical === "STRIPE") {
      // Confirm card payment first (do not set posting yet to avoid unmounting Element)
     
      if (!stripeRef.current) throw new Error("Payment form not ready");
      const intentId = await stripeRef.current.confirm();
      paymentInfo = { provider: "stripe", intentId };
    }

    setPosting(true);

    // Now create the order (mark as paid if stripe)
    const res = await fetch("/api/order/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: cart.products,
        shippingAddress: selectedAddress,
        paymentMethod,
        totalBeforeDiscount: cart.cartTotal,
        total: displayTotal,
        couponApplied: discount > 0 ? coupon : undefined,
        userId: user._id,
        payment: paymentInfo, // server can treat presence as paid
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(data?.message || "Failed to place order.");
    }

    const data = (await res.json()) as { order_id: string };
    // Redirect to order page for all methods now
    router.push(`/order/${data.order_id}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to place order. Please try again.";
    setOrderError(message);
    setPosting(false);
  }
}, [
  paymentMethod,
  selectedAddress,
  totalAfterDiscount,
  cart.cartTotal,
  cart.products,
  coupon,
  discount,
  user._id,
  router,
  isStripeSelected,
]);

  const showNewPrice =
    typeof totalAfterDiscount === "number" &&
    totalAfterDiscount > 0 &&
    totalAfterDiscount < cart.cartTotal;

  const displayTotal = React.useMemo(() => {
    const base = showNewPrice
      ? Number(totalAfterDiscount)
      : Number(cart.cartTotal);
    return Number.isFinite(base) ? base : 0;
  }, [showNewPrice, totalAfterDiscount, cart.cartTotal]);

  /* ----- Render ----- */
  return (
    <div className={styles.summary} aria-busy={posting}>
      {/* Full-panel overlay while placing order */}
      {posting && <DotLoaderSpinner loading />}

      <div className={styles.header}>
        <h3>Order Summary</h3>
      </div>

      {isStripeSelected && (
        <div className={styles.inlineStripeContainer}>
          <h4>Complete your payment</h4>
          <InlineStripeForm
            ref={stripeRef}
            amountCents={Math.round(displayTotal * 100)}
          />
        </div>
      )}

      <div className={styles.coupon}>
        <Formik
          enableReinitialize
          initialValues={{ coupon }}
          validationSchema={couponSchema}
          onSubmit={applyCouponHandler}
        >
          {() => (
            <Form>
              <ShippingInput
                name="coupon"
                placeholder="*Coupon"
                value={coupon}
                disabled={discount > 0 || isApplying || posting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCoupon(e.target.value)
                }
              />
              {error && <span className={styles.error}>{error}</span>}

              {/* Apply / Remove buttons */}
              {discount > 0 ? (
                <button
                  type="button"
                  className={`${styles.apply_btn} ${styles.remove_btn}`}
                  onClick={removeCouponHandler}
                  disabled={isApplying || posting}
                  aria-disabled={isApplying || posting}
                >
                  {isApplying ? "Removing…" : "Remove Coupon"}
                </button>
              ) : (
                <button
                  className={styles.apply_btn}
                  type="submit"
                  disabled={!coupon.trim() || isApplying || posting}
                  aria-disabled={!coupon.trim() || isApplying || posting}
                >
                  {isApplying ? "Applying…" : "Apply"}
                </button>
              )}

              <div className={styles.infos}>
                <span>
                  Total : <b>{Number(cart.cartTotal).toFixed(2)}$</b>
                </span>

                {discount > 0 && (
                  <span className={styles.coupon_span}>
                    Coupon applied : <b>-{discount}%</b>
                  </span>
                )}

                {showNewPrice && (
                  <span>
                    New price : <b>{Number(totalAfterDiscount).toFixed(2)}$</b>
                  </span>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <button
        className={styles.submit_btn}
        onClick={placeOrderHandler}
        disabled={posting}
        aria-disabled={posting}
        aria-label="Place order"
      >
        {posting ? "Placing…" : "Place Order"}
      </button>

      {orderError && <span className={styles.error}>{orderError}</span>}
    </div>
  );
}