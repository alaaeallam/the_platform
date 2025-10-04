
//components/checkout/payment/index.tsx
"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import { paymentMethods } from "@/data/paymentMethods";
import type { PaymentMethod } from "@/types/checkout";

export interface PaymentMethodInfo {
  id: PaymentMethod;           // "STRIPE" | "PAYPAL" | "CASH" | "COD" | "CARD"
  name: string;
  description?: string;
  images?: string[];           // e.g., ["visa","mastercard"]
  disabled?: boolean;          // optional
}

type PaymentProps = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  profile?: boolean;
};

export default function Payment({ paymentMethod, setPaymentMethod, profile }: PaymentProps) {
  const methods = paymentMethods as PaymentMethodInfo[];

  return (
    <div className={styles.payment}>
      {!profile && (
        <div className={styles.header}>
          <h3>Payment Method</h3>
        </div>
      )}

      {methods.map((pm) => {
        const checked = paymentMethod === pm.id;
        return (
          <label
            key={pm.id}
            htmlFor={`pm-${pm.id}`}
            className={`${styles.payment__item} ${checked ? styles.checked : ""}`}
            aria-checked={checked}
          >
            <input
              type="radio"
              id={`pm-${pm.id}`}
              name="payment"
              value={pm.id}
              checked={checked}
              onChange={() => setPaymentMethod(pm.id)}
              disabled={pm.disabled}
            />

            {/* Main method icon */}
            <img src={`/images/checkout/${pm.id}.webp`} alt={`${pm.name} logo`} />

            <div className={styles.payment__item_col}>
              <span>Pay with {pm.name}</span>
              <p>
                {pm.images?.length
                  ? pm.images.map((img) => (
                      <img key={img} src={`/images/payment/${img}.webp`} alt={`${img} logo`} />
                    ))
                  : pm.description}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}