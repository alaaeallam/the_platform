// components/checkout/payment/index.tsx
"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import { paymentMethods } from "@/data/paymentMethods";
import type { PaymentMethod } from "@/types/checkout";

/** Local shape for items in data/paymentMethods */
export interface PaymentMethodInfo {
  id: PaymentMethod;      // reuse the union: "paypal" | "visa" | "mastercard" | "cash" | "stripe"
  name: string;
  description?: string;
  images: string[];       // image ids like "visa", "mastercard", etc.
}

type PaymentProps = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  profile?: boolean;
};

export default function Payment({ paymentMethod, setPaymentMethod, profile }: PaymentProps) {
  // Ensure the imported data is strongly typed
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
            className={styles.payment__item}
            style={{ background: checked ? "#f5f5f5" : "" }}
          >
            <input
              type="radio"
              id={`pm-${pm.id}`}
              name="payment"
              value={pm.id}
              checked={checked}
              onChange={() => setPaymentMethod(pm.id)}
            />

            {/* Icon for the method itself */}
            <img src={`../../../images/checkout/${pm.id}.webp`} alt={pm.name} />

            <div className={styles.payment__item_col}>
              <span>Pay with {pm.name}</span>
              <p>
                {pm.images?.length
                  ? pm.images.map((img) => (
                      <img key={img} src={`../../../images/payment/${img}.webp`} alt="" />
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