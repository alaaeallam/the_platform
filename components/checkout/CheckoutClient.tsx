"use client";

import * as React from "react";
// import Header from "@/components/cart/header";
import Shipping from "@/components/checkout/shipping";
import Products from "@/components/checkout/products";
import Payment from "@/components/checkout/payment";
import Summary from "@/components/checkout/summary";

import styles from "@/app/styles/checkout.module.scss";
import type { Address, UserVM, CartVM, PaymentMethod } from "@/types/checkout";

type Props = {
  user: UserVM;
  cart: CartVM;
};

export default function CheckoutClient({ user, cart }: Props) {
  // Addresses state (default to whatever came from the server)
  const [addresses, setAddresses] = React.useState<Address[]>(
    Array.isArray(user?.address) ? user.address : []
  );

  // Selected address = the one marked active; if none, null
  const [selectedAddress, setSelectedAddress] = React.useState<Address | null>(null);

  // Payment method controlled here; adapt union to your supported methods
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("");

  // Summary can set this after applying a coupon, etc.
  // Keep as string to match your legacy Summary prop contract.
  const [totalAfterDiscount, setTotalAfterDiscount] = React.useState<number | "">("");

  // Pick active address whenever list changes
  React.useEffect(() => {
    const active = addresses.find((a) => a?.active);
    setSelectedAddress(active ?? null);
  }, [addresses]);

  return (
    <>
      {/* <Header /> */}
      <div className={`${styles.container} ${styles.checkout}`}>
        <div className={styles.checkout__side}>
          <Shipping
            user={user}
            addresses={addresses}
            setAddresses={setAddresses}
          />
          <Products cart={cart} />
        </div>

        <div className={styles.checkout__side}>
          <Payment
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
          <Summary
            totalAfterDiscount={totalAfterDiscount}
            setTotalAfterDiscount={setTotalAfterDiscount}
            user={user}
            cart={cart}
            paymentMethod={paymentMethod}
            selectedAddress={selectedAddress}
          />
        </div>
      </div>
    </>
  );
}