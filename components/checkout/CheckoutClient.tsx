"use client";

import * as React from "react";
import dynamic from "next/dynamic";
// import Header from "@/components/cart/header";
import Shipping from "@/components/checkout/shipping";
import InlineStripeForm from "@/components/checkout/summary/InlineStripeForm";

import styles from "@/app/styles/checkout.module.scss";
import type { Address, UserVM, CartVM, PaymentMethod } from "@/types/checkout";
import type { InlineStripeHandle } from "@/components/checkout/summary/InlineStripeForm";

type Props = {
  user: UserVM;
  cart: CartVM;
};

const Products = dynamic(() => import("@/components/checkout/products"));
const Payment = dynamic(() => import("@/components/checkout/payment"));
const Summary = dynamic(() => import("@/components/checkout/summary"));

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

  const stripeRef = React.useRef<InlineStripeHandle | null>(null);

  const rawCartTotal = cart?.cartTotal as number | { total?: number | string } | null | undefined;
  const cartTotal = Number(
    typeof rawCartTotal === "number"
      ? rawCartTotal
      : rawCartTotal?.total ?? 0
  );
  const displayTotal =
    typeof totalAfterDiscount === "number" ? totalAfterDiscount : cartTotal;

  const normalizedPaymentMethod = String(paymentMethod || "").toLowerCase();
  const isStripeSelected =
    normalizedPaymentMethod === "credit_card" ||
    normalizedPaymentMethod === "stripe" ||
    normalizedPaymentMethod === "visa" ||
    normalizedPaymentMethod === "mastercard";

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
            profile={false}
            selectedMethodContent={
              isStripeSelected ? (
                <div>
                  <h4 style={{ margin: "0 0 12px" }}>Complete your payment</h4>
                  <InlineStripeForm
                    ref={stripeRef}
                    amountCents={Math.round(displayTotal * 100)}
                  />
                </div>
              ) : null
            }
          />
          <Summary
            totalAfterDiscount={totalAfterDiscount}
            setTotalAfterDiscount={setTotalAfterDiscount}
            user={user}
            cart={cart}
            paymentMethod={paymentMethod}
            selectedAddress={selectedAddress}
            stripeRef={stripeRef}
          />
        </div>
      </div>
    </>
  );
}