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
};

export default function Checkout({
  subtotal,
  shippingFee,
  total,
  selected,
  saveCartToDbHandler,
}: Props): React.JSX.Element {
  const [busy, setBusy] = React.useState(false);
  const disabled = busy || selected.length === 0;

  const onContinue = React.useCallback(async () => {
    if (disabled) return;
    try {
      setBusy(true);
      await Promise.resolve(saveCartToDbHandler());
      // typically unmounts after router.push in the handler
    } catch (err) {
      // eslint-disable-next-line no-console
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
        <span>+{toMoney(shippingFee)}$</span>
      </div>

      <div className={styles.cart__checkout_total}>
        <span>Total</span>
        <span>US{toMoney(total)}$</span>
      </div>

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