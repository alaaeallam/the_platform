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

  const [coupon, setCoupon] = React.useState<string>("");
  const [discount, setDiscount] = React.useState<number>(0);
  const [error, setError] = React.useState<string>("");
  const [orderError, setOrderError] = React.useState<string>("");

  // loaders
  const [posting, setPosting] = React.useState<boolean>(false);      // place order
  const [isApplying, setIsApplying] = React.useState<boolean>(false); // coupon apply/remove

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
          couponApplied: discount > 0 ? coupon : undefined,
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
    discount,
    user._id,
    router,
  ]);

  const showNewPrice =
    typeof totalAfterDiscount === "number" &&
    totalAfterDiscount > 0 &&
    totalAfterDiscount < cart.cartTotal;

  /* ----- Render ----- */
  return (
    <div className={styles.summary} aria-busy={posting}>
      {/* Full-panel overlay while placing order */}
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