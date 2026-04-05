"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import ShippingInput from "../../inputs/shippingInput";
import { countries } from "@/data/countries";
import { applyCoupon } from "../../../requests/user";
import { useRouter } from "next/navigation";
import DotLoaderSpinner from "@/components/loaders/dotLoader";

import dynamic from "next/dynamic";



import type { Address, UserVM, CartVM, PaymentMethod } from "@/types/checkout";
import type { InlineStripeHandle } from "./InlineStripeForm";
type CanonicalPM = "STRIPE" | "PAYPAL" | "CASH";

type DeliveryQuoteResponse = {
  ok: boolean;
  message?: string;
  delivery?: {
    fee: number;
    currency: string;
    freeShippingApplied: boolean;
    estimatedDaysMin: number;
    estimatedDaysMax: number;
  };
  preview?: {
    fee: number;
    freeShippingApplied: boolean;
    eta: string;
  };
};

function toCanonical(pm: PaymentMethod | null | undefined): CanonicalPM | null {
  if (pm === "paypal") return "PAYPAL";
  if (pm === "cash") return "CASH";
  if (pm === "stripe" || pm === "visa" || pm === "mastercard") return "STRIPE";
  return null;
}

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

const InlineStripeForm = dynamic(() => import("./InlineStripeForm"), {
  ssr: false,
  loading: () => <p>Loading payment…</p>,
});





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

  const [deliveryFee, setDeliveryFee] = React.useState<number>(0);
  const [deliveryCurrency, setDeliveryCurrency] = React.useState<string>("USD");
  const [deliveryEta, setDeliveryEta] = React.useState<string>("");
  const [deliveryFreeShipping, setDeliveryFreeShipping] = React.useState<boolean>(false);
  const [deliveryLoading, setDeliveryLoading] = React.useState<boolean>(false);
  const [deliveryError, setDeliveryError] = React.useState<string>("");

  const [posting, setPosting] = React.useState<boolean>(false);
  const [isApplying, setIsApplying] = React.useState<boolean>(false);

  React.useEffect(() => {
    setOrderError("");
  }, [paymentMethod, selectedAddress, deliveryError]);

  const applyCouponHandler = React.useCallback(async () => {
    setError("");
    setIsApplying(true);

    try {
      const res = await applyCoupon(coupon);

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
    }
  }, [coupon, setTotalAfterDiscount]);

  const removeCouponHandler = React.useCallback(async () => {
    setIsApplying(true);

    try {
      setDiscount(0);
      setTotalAfterDiscount("");
      setCoupon("");
      setError("");
    } finally {
      setIsApplying(false);
    }
  }, [setTotalAfterDiscount]);

  const showNewPrice =
    typeof totalAfterDiscount === "number" &&
    totalAfterDiscount > 0 &&
    totalAfterDiscount < cart.cartTotal;

  const subtotalDisplay = React.useMemo(() => {
    const base = showNewPrice ? Number(totalAfterDiscount) : Number(cart.cartTotal);
    return Number.isFinite(base) ? base : 0;
  }, [showNewPrice, totalAfterDiscount, cart.cartTotal]);

  const selectedCountryCode = React.useMemo(() => {
    const address = selectedAddress as
      | (Address & { countryCode?: string; country?: string })
      | null
      | undefined;

    const directCode = String(address?.countryCode || "").trim().toUpperCase();
    if (directCode) return directCode;

    const countryName = String(address?.country || "").trim().toLowerCase();
    if (!countryName) return "";

    const matched = countries.find(
      (entry) => String(entry.name || "").trim().toLowerCase() === countryName
    );

    return String(matched?.code || "").trim().toUpperCase();
  }, [selectedAddress]);

  const displayTotal = React.useMemo(() => {
    return Number((subtotalDisplay + deliveryFee).toFixed(2));
  }, [subtotalDisplay, deliveryFee]);

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
    if (deliveryLoading) {
      setOrderError("Please wait while delivery is being calculated.");
      return;
    }
    if (deliveryError) {
      setOrderError(deliveryError);
      return;
    }

    try {
      const canonical = isStripeSelected ? "STRIPE" : toCanonical(paymentMethod);

      let paymentInfo: { provider: "stripe"; intentId: string } | undefined;
      if (canonical === "STRIPE") {
        if (!stripeRef.current) throw new Error("Payment form not ready");
        const intentId = await stripeRef.current.confirm();
        paymentInfo = { provider: "stripe", intentId };
      }

      setPosting(true);

      const res = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: cart.products,
          shippingAddress: {
            ...selectedAddress,
            countryCode: selectedCountryCode,
          },
          paymentMethod,
          totalBeforeDiscount: cart.cartTotal,
          total: displayTotal,
          couponApplied: discount > 0 ? coupon : undefined,
          userId: user._id,
          payment: paymentInfo,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data?.message || "Failed to place order.");
      }

      const data = (await res.json()) as { order_id: string };
      router.push(`/order/${data.order_id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to place order. Please try again.";
      setOrderError(message);
      setPosting(false);
    }
  }, [
    paymentMethod,
    selectedAddress,
    cart.cartTotal,
    cart.products,
    coupon,
    discount,
    user._id,
    router,
    isStripeSelected,
    deliveryLoading,
    deliveryError,
    displayTotal,
    selectedCountryCode,
  ]);

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchDeliveryQuote() {
      if (!selectedAddress) {
        setDeliveryFee(0);
        setDeliveryCurrency("USD");
        setDeliveryEta("");
        setDeliveryFreeShipping(false);
        setDeliveryError("");
        setDeliveryLoading(false);
        return;
      }

      if (!selectedCountryCode) {
        setDeliveryFee(0);
        setDeliveryCurrency("USD");
        setDeliveryEta("");
        setDeliveryFreeShipping(false);
        setDeliveryError("Selected address is missing country code.");
        setDeliveryLoading(false);
        return;
      }

      try {
        setDeliveryLoading(true);
        setDeliveryError("");

        const res = await fetch(
          `/api/delivery/quote?countryCode=${encodeURIComponent(
            selectedCountryCode
          )}&subtotal=${encodeURIComponent(String(subtotalDisplay))}`,
          { method: "GET", cache: "no-store" }
        );

        const data = (await res.json()) as DeliveryQuoteResponse;

        if (!res.ok || !data.ok || !data.delivery) {
          throw new Error(data.message || "Delivery is not available for the selected country.");
        }

        if (isCancelled) return;

        setDeliveryFee(Number(data.delivery.fee || 0));
        setDeliveryCurrency(String(data.delivery.currency || "USD"));
        setDeliveryEta(
          data.preview?.eta || `${data.delivery.estimatedDaysMin}-${data.delivery.estimatedDaysMax}`
        );
        setDeliveryFreeShipping(Boolean(data.delivery.freeShippingApplied));
      } catch (err) {
        if (isCancelled) return;
        setDeliveryFee(0);
        setDeliveryCurrency("USD");
        setDeliveryEta("");
        setDeliveryFreeShipping(false);
        setDeliveryError(
          err instanceof Error
            ? err.message
            : "Delivery is not available for the selected country."
        );
      } finally {
        if (!isCancelled) setDeliveryLoading(false);
      }
    }

    void fetchDeliveryQuote();

    return () => {
      isCancelled = true;
    };
  }, [selectedAddress, selectedCountryCode, subtotalDisplay]);

  return (
    <div className={styles.summary} aria-busy={posting}>
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
                  Subtotal : <b>{Number(cart.cartTotal).toFixed(2)}$</b>
                </span>

                {discount > 0 && (
                  <span className={styles.coupon_span}>
                    Coupon applied : <b>-{discount}%</b>
                  </span>
                )}

                {showNewPrice && (
                  <span>
                    Discounted subtotal : <b>{Number(totalAfterDiscount).toFixed(2)}$</b>
                  </span>
                )}

                <span>
                  Shipping :{" "}
                  <b>
                    {deliveryLoading
                      ? "Calculating…"
                      : deliveryFreeShipping
                      ? `Free (${deliveryCurrency})`
                      : `${Number(deliveryFee).toFixed(2)} ${deliveryCurrency}`}
                  </b>
                </span>

                {deliveryEta && (
                  <span>
                    Delivery ETA : <b>{deliveryEta} days</b>
                  </span>
                )}

                <span>
                  Final total : <b>{Number(displayTotal).toFixed(2)}$</b>
                </span>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <button
        className={styles.submit_btn}
        onClick={placeOrderHandler}
        disabled={posting || deliveryLoading || Boolean(deliveryError)}
        aria-disabled={posting || deliveryLoading || Boolean(deliveryError)}
        aria-label="Place order"
      >
        {posting ? "Placing…" : deliveryLoading ? "Calculating shipping…" : "Place Order"}
      </button>

      {orderError && <span className={styles.error}>{orderError}</span>}
      {deliveryError && !orderError && <span className={styles.error}>{deliveryError}</span>}
    </div>
  );
}