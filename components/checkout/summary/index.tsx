// components/checkout/summary/index.tsx
"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import ShippingInput from "../../inputs/shippingInput";
import { applyCoupon } from "../../../requests/user";
import { useRouter } from "next/navigation";
import DotLoaderSpinner from "@/components/loaders/dotLoader";

import type { Address, UserVM, CartVM, PaymentMethod } from "@/types/checkout";

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

export default function Summary({
  totalAfterDiscount,
  setTotalAfterDiscount,
  user,
  cart,
  paymentMethod,
  selectedAddress,
}: SummaryProps): React.JSX.Element {
  const router = useRouter();

  const [coupon, setCoupon] = React.useState<string>("");
  const [discount, setDiscount] = React.useState<number>(0);
  const [error, setError] = React.useState<string>("");
  const [orderError, setOrderError] = React.useState<string>("");
  const [posting, setPosting] = React.useState<boolean>(false);   // placing order
  const [applying, setApplying] = React.useState<boolean>(false); // applying coupon

  /* ----- Coupon handler (with logs) ----- */
  const applyCouponHandler = React.useCallback(async () => {
    setError("");
    setApplying(true);

    const code = coupon.trim();
    const t0 = performance.now();

    console.groupCollapsed("%cApply coupon", "color:#2f82ff;font-weight:bold");
    console.log("coupon code →", code || "(empty)");
    console.log("cartTotal →", Number(cart.cartTotal).toFixed(2));

    try {
      const res = await applyCoupon(code);
      console.log(`applyCoupon(): ${performance.now() - t0} ms`);
      console.log("API ok? →", res.ok);

      if (!res.ok) {
        console.log("API error →", res.error);
        setDiscount(0);
        setTotalAfterDiscount("");
        setError(res.error || "Invalid coupon.");
        return;
      }

      // Expecting: { totalAfterDiscount: number, discount: number }
      console.log("API data →", res.data);
      setTotalAfterDiscount(res.data.totalAfterDiscount);
      setDiscount(res.data.discount);
    } catch (e) {
      console.log("Exception →", e);
      setDiscount(0);
      setTotalAfterDiscount("");
      setError("Something went wrong applying the coupon. Please try again.");
    } finally {
      setApplying(false);
      console.groupEnd();
    }
  }, [coupon, cart.cartTotal, setTotalAfterDiscount]);

  /* ----- Order handler (unchanged, keeps overlay loader) ----- */
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

    const finalTotal =
      typeof totalAfterDiscount === "number" && !Number.isNaN(totalAfterDiscount)
        ? totalAfterDiscount
        : cart.cartTotal;

    try {
      setPosting(true);
      const res = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: cart.products,
          shippingAddress: selectedAddress,
          paymentMethod,
          total: finalTotal,
          totalBeforeDiscount: cart.cartTotal,
          couponApplied: coupon || undefined,
          userId: user._id,
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
        err instanceof Error
          ? err.message
          : (typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message: unknown }).message === "string")
          ? (err as { message: string }).message
          : "Unable to place order. Please try again.";
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
    user._id,
    router,
  ]);

  const showNewPrice =
    typeof totalAfterDiscount === "number" &&
    totalAfterDiscount > 0 &&
    totalAfterDiscount < cart.cartTotal;

  return (
    <div className={styles.summary} aria-busy={posting}>
      {posting && <DotLoaderSpinner loading />}

      <div className={styles.header}>
        <h3>Order Summary</h3>
      </div>

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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCoupon(e.target.value)
                }
                disabled={applying || posting}
              />
              {error && <span className={styles.error}>{error}</span>}

              <button
                className={styles.apply_btn}
                type="submit"
                disabled={!coupon.trim() || applying || posting}
                aria-disabled={!coupon.trim() || applying || posting}
              >
                {applying ? "Applying…" : "Apply"}
              </button>

              <div className={styles.infos}>
                <span>
                  Total : <b>{cart.cartTotal}$</b>
                </span>

                {discount > 0 && (
                  <span className={styles.coupon_span}>
                    Coupon applied : <b>-{discount}%</b>
                  </span>
                )}

                {showNewPrice && (
                  <span>
                    New price : <b>{totalAfterDiscount}$</b>
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
        disabled={posting || applying}
        aria-disabled={posting || applying}
        aria-label="Place order"
      >
        {posting ? "Placing…" : "Place Order"}
      </button>

      {orderError && <span className={styles.error}>{orderError}</span>}
    </div>
  );
}