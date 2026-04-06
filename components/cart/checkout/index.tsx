// components/cart/checkout/index.tsx
"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import DotLoaderSpinner from "@/components/loaders/dotLoader";
import type { CartProduct } from "@/types/cart";

type Props = {
  subtotal: number;
  shippingFee: number;
  total: number;
  selected: CartProduct[];
  saveCartToDbHandler: () => Promise<void> | void;
  countryCode?: string;
};

export default function Checkout({
  subtotal,
  shippingFee,
  selected,
  saveCartToDbHandler,
  countryCode,
}: Props): React.JSX.Element {
  const [busy, setBusy] = React.useState(false);

  const [deliveryFee, setDeliveryFee] = React.useState<number>(shippingFee || 0);
  const [deliveryEta, setDeliveryEta] = React.useState<string>("");
  const [deliveryLoading, setDeliveryLoading] = React.useState(false);
  const [deliveryError, setDeliveryError] = React.useState<string>("");

  const disabled = busy || selected.length === 0 || deliveryLoading || Boolean(deliveryError);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchDelivery() {
      if (!countryCode) return;

      try {
        setDeliveryLoading(true);
        setDeliveryError("");

        const res = await fetch(
          `/api/delivery/quote?countryCode=${encodeURIComponent(countryCode)}&subtotal=${encodeURIComponent(String(subtotal))}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Delivery unavailable");
        }

        if (cancelled) return;

        setDeliveryFee(Number(data.delivery.fee || 0));
        setDeliveryEta(data.preview?.eta || "");
      } catch {
        if (cancelled) return;
        setDeliveryFee(0);
        setDeliveryEta("");
        setDeliveryError("Delivery not available for this country");
      } finally {
        if (!cancelled) setDeliveryLoading(false);
      }
    }

    fetchDelivery();

    return () => {
      cancelled = true;
    };
  }, [countryCode, subtotal]);

  const onContinue = React.useCallback(async () => {
    if (disabled) return;
    try {
      setBusy(true);
      await Promise.resolve(saveCartToDbHandler());
      // typically unmounts after router.push in the handler
    } catch (err) {
      console.error("Continue failed:", err);
      setBusy(false);
    }
  }, [disabled, saveCartToDbHandler]);

  const toMoney = (n: number) => Number(n || 0).toFixed(2);

  return (
    <div className={`${styles.cart__checkout} ${styles.card}`} aria-busy={busy}>
      {/* render overlay ONLY when busy */}
      {busy && <DotLoaderSpinner loading />}

      <h2>Order Summary</h2>

      <div className={styles.cart__checkout_line}>
        <span>Subtotal</span>
        <span>US${toMoney(subtotal)}</span>
      </div>

      <div className={styles.cart__checkout_line}>
        <span>Shipping</span>
        <span>
          {deliveryLoading
            ? "Calculating..."
            : deliveryError
            ? "Unavailable"
            : `+${toMoney(deliveryFee)}$`}
        </span>
      </div>

      {deliveryEta && (
        <div className={styles.cart__checkout_line}>
          <span>ETA</span>
          <span>{deliveryEta} days</span>
        </div>
      )}

      <div className={styles.cart__checkout_total}>
        <span>Total</span>
        <span>US{toMoney(subtotal + deliveryFee)}$</span>
      </div>

      {deliveryError && (
        <div style={{ color: "red", marginBottom: 8 }}>
          {deliveryError}
        </div>
      )}

      <div className={styles.submit}>
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          aria-disabled={disabled}
          aria-label="Continue to checkout"
          style={{
            background: disabled ? "#eee" : undefined,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Continuing…" : "Continue"}
        </button>
      </div>
    </div>
  );
}