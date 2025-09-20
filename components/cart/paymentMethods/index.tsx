// components/cart/paymentMethods/index.tsx
"use client";

import Image from "next/image";
import styles from "./styles.module.scss";

export default function PaymentMethods() {
  return (
    <div className={`${styles.card} ${styles.cart__method}`}>
      <h2 className={styles.header}>Payment Methods</h2>
      <div className={styles.images}>
        <Image
          src="/images/payment/visa.webp"
          alt="Visa"
          width={60}
          height={40}
        />
        <Image
          src="/images/payment/mastercard.webp"
          alt="Mastercard"
          width={60}
          height={40}
        />
        <Image
          src="/images/payment/paypal.webp"
          alt="PayPal"
          width={60}
          height={40}
        />
      </div>

      <h2 className={styles.header}>Buyer Protection</h2>
      <div className={styles.protection}>
        <Image
          src="/images/protection.png"
          alt="Buyer protection"
          width={50}
          height={50}
        />
        <span>
          Get full refund if the item is not as described or if it&apos;s not
          delivered.
        </span>
      </div>
    </div>
  );
}