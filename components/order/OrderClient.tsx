"use client";

import React, { useReducer, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import { IoIosArrowForward } from "react-icons/io";

import styles from "@/app/styles/order.module.scss";
import StripePayment from "@/components/stripePayment";
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
  type ReactPayPalScriptOptions,
  SCRIPT_LOADING_STATE,
  DISPATCH_ACTION
} from "@paypal/react-paypal-js";
import type { OnApproveActions, CreateOrderActions } from "@paypal/paypal-js";

/* ----------------------------- Types ----------------------------- */
type OrderProduct = {
  _id?: string;
  product?: string;
  name: string;
  image: string;
  size?: string;
  qty: number;
  color?: { color?: string; image?: string };
  price?: number;           // ← make optional
  unitPrice?: number;       // ← allow normalized shape
  unitShipping?: number;
  lineTotal?: number;
  lineShipping?: number;
};

type Address = {
  firstName: string; lastName: string; phoneNumber?: string;
  address1: string; address2?: string; city: string; state: string;
  zipCode: string; country: string;
};

type UserLite = { _id?: string; name?: string; email?: string; image?: string };

export type OrderView = {
  _id: string;
  user: UserLite;
  products: OrderProduct[];
  shippingAddress: Address;
  paymentMethod: "paypal" | "credit_card" | "cash" | (string & {});
  total: number;
  totalBeforeDiscount?: number;
  couponApplied?: string;
  shippingPrice: number;
  taxPrice: number;
  isPaid: boolean;
  status:
    | "Not Processed"
    | "Processing"
    | "Dispatched"
    | "Cancelled"
    | "Completed"
    | (string & {});
};

type Props = {
  order: OrderView;
  paypalClientId: string;
  stripePublicKey: string;
};

/* ---------------------------- Reducer ---------------------------- */
type State = { loading: boolean; success: boolean; error: string | null };
type Action =
  | { type: "PAY_REQUEST" }
  | { type: "PAY_SUCCESS" }
  | { type: "PAY_FAIL"; payload: string }
  | { type: "PAY_RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PAY_REQUEST": return { ...state, loading: true, error: null };
    case "PAY_SUCCESS": return { loading: false, success: true, error: null };
    case "PAY_FAIL":    return { loading: false, success: false, error: action.payload };
    case "PAY_RESET":   return { loading: false, success: false, error: null };
    default:            return state;
  }
}

/* ----------------------- PayPal Section (child) ------------------ */
function PayPalSection({
  orderId,
  total,
  clientId,
  onStart,
  onSuccess,
  onError,
}: {
  orderId: string;
  total: number;
  clientId: string;
  onStart: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  useEffect(() => {
    // build strongly-typed actions (v8+ uses `clientId` camelCase)
    paypalDispatch({
       type: DISPATCH_ACTION.RESET_OPTIONS,
      value: { clientId, currency: "USD" } as ReactPayPalScriptOptions,
    });

    paypalDispatch({
      type: DISPATCH_ACTION.LOADING_STATUS,
      value: SCRIPT_LOADING_STATE.PENDING,
    });
  }, [clientId, paypalDispatch]);

  function createOrderHandler(_: unknown, actions: CreateOrderActions) {
    return actions.order
      .create({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: String(total) } }]
      })
      .then((ppOrderId: string) => ppOrderId);
  }

  async function onApproveHandler(_: unknown, actions: OnApproveActions) {
    if (!actions.order) {
      onError("PayPal order actions are unavailable.");
      return;
    }
    const details = await actions.order.capture();
    try {
      onStart();
      await axios.put(`/api/order/${orderId}/pay`, details);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error).message ??
        "Payment failed.";
      onError(msg);
    }
  }

  const handleError = (err: unknown) =>
    onError((err as Error)?.message ?? "PayPal experienced a problem. Try again.");

  return isPending ? (
    <span>loading...</span>
  ) : (
    <PayPalButtons
      createOrder={createOrderHandler}
      onApprove={onApproveHandler}
      onError={handleError}
    />
  );
}

/* ---------------------------- Component -------------------------- */
export default function OrderClient({
  
  order,
  paypalClientId,
  stripePublicKey,
}: Props): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, {
    loading: false, success: false, error: null,
  });
 if (!order || typeof order !== "object") {
    return (
      <div className={styles.order}>
        <div className={styles.container}>
          <div className={styles.error}>Order not found.</div>
        </div>
      </div>
    );
  }
  /* ------- UI helpers to match previous look -------- */
    const norm = {
  _id: String((order as { _id?: string })._id ?? ""),
  user: order.user ?? {},
  products: Array.isArray(order.products) ? order.products : [],
  paymentMethod: (order.paymentMethod ?? "cash") as Props["order"]["paymentMethod"],
  isPaid: !!order.isPaid,
  status: String(order.status ?? "Not Processed") as Props["order"]["status"],
  shippingAddress: order.shippingAddress as Props["order"]["shippingAddress"],
  total: Number.isFinite(Number(order.total)) ? Number(order.total) : 0,
  totalBeforeDiscount: Number.isFinite(Number(order.totalBeforeDiscount))
    ? Number(order.totalBeforeDiscount)
    : undefined,
  couponApplied: order.couponApplied ?? undefined,
  taxPrice: Number.isFinite(Number(order.taxPrice)) ? Number(order.taxPrice) : 0,
} as OrderView;

const statusClass =
    norm.status === "Not Processed" ? styles.not_processed
    : norm.status === "Processing" ? styles.processing
    : norm.status === "Dispatched" ? styles.dispatched
    : norm.status === "Cancelled" ? styles.cancelled
    : norm.status === "Completed" ? styles.completed
    : "";
    const totalSafe = Number(norm.total ?? 0);
    const taxSafe = Number(norm.taxPrice ?? 0);
    const tbdSafe = Number(norm.totalBeforeDiscount ?? totalSafe);
    const couponDelta = Number((tbdSafe - totalSafe).toFixed(2));
  return (
    <div className={styles.order}>
      <div className={styles.container}>
        {/* LEFT SIDE — order info (same structure as old) */}
        <div className={styles.order__infos}>
          <div className={styles.order__header}>
            <div className={styles.order__header_head}>
              Home <IoIosArrowForward /> Orders <IoIosArrowForward /> ID {order._id}
            </div>

            <div className={styles.order__header_status}>
              Payment Status:&nbsp;
              {order.isPaid ? (
                // Use next/image for remote images allowed in next.config
                <Image
                  src="/images/verified.png"
                  alt="paid"
                  width={18}
                  height={18}
                />
              ) : (
                <Image
                  src="/images/unverified.png"
                  alt="unpaid"
                  width={20}
                  height={18}
                />
              )}
            </div>

            <div className={styles.order__header_status}>
              Order Status:&nbsp;
              <span className={statusClass}>{order.status}</span>
            </div>
          </div>

          <div className={styles.order__products}>
            {order.products.map((p) => {
  const qty = Number(p.qty ?? 0);
  const unitPrice = Number(
    (p as { unitPrice?: number; price?: number }).unitPrice ?? (p as { price?: number }).price ?? 0
  );
  const lineTotal = Number(
    (p as { lineTotal?: number }).lineTotal ?? unitPrice * qty
  );

  return (
    <div className={styles.product} key={p._id ?? `${p.name}-${p.size}-${unitPrice}-${qty}`}>
      <div className={styles.product__img}>
        <Image
          src={p.image || p.color?.image || "/images/placeholder.png"}
          alt={p.name}
          width={90}
          height={90}
        />
      </div>

      <div className={styles.product__infos}>
        <h1 className={styles.product__infos_name}>
          {p.name.length > 30 ? `${p.name.substring(0, 30)}...` : p.name}
        </h1>

        <div className={styles.product__infos_style}>
          {!!p.color?.image && (
            <Image
              src={p.color.image}
              alt="variant"
              width={18}
              height={18}
            />
          )}{" "}
          / {p.size ?? "--"}
        </div>

        <div className={styles.product__infos_priceQty}>
          ${unitPrice.toFixed(2)} x {qty}
        </div>

        <div className={styles.product__infos_total}>
          ${lineTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
})}
            <div className={styles.order__products_total}>
              {order.couponApplied ? (
  <>
    <div className={styles.order__products_total_sub}>
      <span>Subtotal</span>
      <span>{tbdSafe.toFixed(2)}$</span>
    </div>
    <div className={styles.order__products_total_sub}>
      <span>
        Coupon Applied <em>({order.couponApplied})</em>
      </span>
      <span>-{couponDelta.toFixed(2)}$</span>
    </div>
    <div className={styles.order__products_total_sub}>
      <span>Tax price</span>
      <span>+{taxSafe.toFixed(2)}$</span>
    </div>
    <div className={`${styles.order__products_total_sub} ${styles.bordertop}`}>
      <span>TOTAL TO PAY</span>
      <b>{totalSafe.toFixed(2)}$</b>
    </div>
  </>
) : (
  <>
    <div className={styles.order__products_total_sub}>
      <span>Tax price</span>
      <span>+{taxSafe.toFixed(2)}$</span>
    </div>
    <div className={`${styles.order__products_total_sub} ${styles.bordertop}`}>
      <span>TOTAL TO PAY</span>
      <b>{totalSafe.toFixed(2)}$</b>
    </div>
  </>
)}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — addresses + payment (same as old) */}
        <div className={styles.order__actions}>
          <div className={styles.order__address}>
            <h1>Customer&apos;s Order</h1>

            <div className={styles.order__address_user}>
              <div className={styles.order__address_user_infos}>
                <Image
                  src={order.user.image || "/images/avatar.png"}
                  alt={order.user.name || "user"}
                  width={40}
                  height={40}
                />
                <div>
                  <span>{order.user.name}</span>
                  <span>{order.user.email}</span>
                </div>
              </div>
            </div>

            <div className={styles.order__address_shipping}>
              <h2>Shipping Address</h2>
              <span>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </span>
              <span>{order.shippingAddress.address1}</span>
              {!!order.shippingAddress.address2 && <span>{order.shippingAddress.address2}</span>}
              <span>
                {order.shippingAddress.state}, {order.shippingAddress.city}
              </span>
              <span>{order.shippingAddress.zipCode}</span>
              <span>{order.shippingAddress.country}</span>
            </div>

            <div className={styles.order__address_shipping}>
              <h2>Billing Address</h2>
              <span>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </span>
              <span>{order.shippingAddress.address1}</span>
              {!!order.shippingAddress.address2 && <span>{order.shippingAddress.address2}</span>}
              <span>
                {order.shippingAddress.state}, {order.shippingAddress.city}
              </span>
              <span>{order.shippingAddress.zipCode}</span>
              <span>{order.shippingAddress.country}</span>
            </div>
          </div>

          {!order.isPaid && (
            <div className={styles.order__payment}>
              {order.paymentMethod === "paypal" && (
                <PayPalScriptProvider
                  key={`pp-${paypalClientId}`}
                  options={{ clientId: paypalClientId, currency: "USD" }}
                >
                  <PayPalSection
                    orderId={order._id}
                    total={order.total}
                    clientId={paypalClientId}
                    onStart={() => dispatch({ type: "PAY_REQUEST" })}
                    onSuccess={() => dispatch({ type: "PAY_SUCCESS" })}
                    onError={(msg) => dispatch({ type: "PAY_FAIL", payload: msg })}
                  />
                  {state.error && (
                    <div className={styles.error} style={{ marginTop: 8 }}>
                      {state.error}
                    </div>
                  )}
                </PayPalScriptProvider>
              )}

              {order.paymentMethod === "credit_card" && (
                <StripePayment
                  total={order.total}
                  orderId={order._id}
                  stripePublicKey={stripePublicKey}
                />
              )}

              {order.paymentMethod === "cash" && (
                <div className={styles.cash}>cash</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}