
//components/checkout/payment/index.tsx
"use client";

import * as React from "react";
import styles from "./styles.module.scss";
import { paymentMethods } from "@/data/paymentMethods";
import type { PaymentMethod } from "@/types/checkout";
import Image from "next/image";

export interface PaymentMethodInfo {
  id: PaymentMethod;           // e.g. "stripe" | "paypal" | "cash" | "cod" | "credit_card"
  name: string;
  description?: string;
  images?: string[];           // e.g., ["visa","mastercard"]
  disabled?: boolean;
}

type PaymentProps = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  profile?: boolean;
};

export default function Payment({ paymentMethod, setPaymentMethod, profile }: PaymentProps) {
  // Make sure we treat the list as readonly + well-typed
  const methods = React.useMemo<readonly PaymentMethodInfo[]>(
    () => paymentMethods as readonly PaymentMethodInfo[],
    []
  );

  // Centralized setter to avoid accidental uppercase IDs etc.
  const selectMethod = React.useCallback(
    (id: PaymentMethod) => {
      // Normalize to lowercase to match API/backend expectations
      const normalized = String(id).toLowerCase() as PaymentMethod;
      setPaymentMethod(normalized);
    },
    [setPaymentMethod]
  );

  return (
    <div className={styles.payment}>
      {!profile && (
        <div className={styles.header}>
          <h3>Payment Method</h3>
        </div>
      )}

      {methods.map((pm) => {
        const checked = paymentMethod === pm.id;
        const inputId = `pm-${pm.id}`;
        const logoSrc = `/images/checkout/${String(pm.id).toLowerCase()}.webp`;

        return (
          <label
            key={pm.id}
            htmlFor={inputId}
            className={`${styles.payment__item} ${checked ? styles.checked : ""}`}
            aria-checked={checked}
            aria-disabled={pm.disabled || undefined}
            onKeyDown={(e) => {
              if (pm.disabled) return;
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                selectMethod(pm.id);
              }
            }}
            tabIndex={0}
          >
            <input
              type="radio"
              id={inputId}
              name="payment"
              value={pm.id}
              checked={checked}
              onChange={() => selectMethod(pm.id)}
              disabled={pm.disabled}
            />

            {/* Main method icon */}
            <Image
              src={logoSrc}
              alt={`${pm.name} logo`}
              width={40}
              height={40}
              sizes="40px"
              style={{ width: 40, height: 40 }}
              priority={false}
            />

            <div className={styles.payment__item_col}>
              <span>Pay with {pm.name}</span>
              <p>
                {pm.images?.length
                  ? pm.images.map((img) => {
                      const brandSrc = `/images/payment/${String(img).toLowerCase()}.webp`;
                      return (
                        <Image
                          key={img}
                          src={brandSrc}
                          alt={`${img} logo`}
                          width={36}
                          height={24}
                          sizes="36px"
                          style={{ width: 36, height: 24, objectFit: "contain" }}
                          priority={false}
                        />
                      );
                    })
                  : pm.description}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}