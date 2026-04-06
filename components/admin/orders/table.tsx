"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import type { AdminOrderVM } from "@/types/admin/orders";

export type OrderStatus =
  | "Not Processed"
  | "Processing"
  | "Dispatched"
  | "Cancelled"
  | "Completed";

export type PaymentMethod = "paypal" | "credit_card" | "cod" | string;
export type PaymentStatus = "paid" | "unpaid";

export interface AdminUserVM {
  _id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
}

export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phoneNumber?: string;
}

export interface OrderLineItem {
  _id: string;
  image?: string;
  name?: string;
  size?: string | number;
  qty?: number;
  price?: number;
}

const PAYMENT_LABEL: Record<string, string> = {
  paypal: "Paypal",
  credit_card: "Credit Card",
  stripe: "Credit Card",
  visa: "Credit Card",
  mastercard: "Credit Card",
  amex: "Credit Card",
  cod: "Cash On Delivery",
  cash: "Cash On Delivery",
};

function formatPaymentLabel(method: string | null | undefined): string {
  if (!method) return "-";
  const key = String(method).toLowerCase();
  return PAYMENT_LABEL[key] ?? key.toUpperCase();
}

function chipStyles(kind: "status" | "paid" | "coupon", value: string) {
  if (kind === "paid") {
    return {
      backgroundColor: value === "Paid" ? "#dcfce7" : "#fee2e2",
      color: value === "Paid" ? "#166534" : "#991b1b",
      border: value === "Paid" ? "1px solid #86efac" : "1px solid #fca5a5",
    } as const;
  }

  if (kind === "coupon") {
    return {
      backgroundColor: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    } as const;
  }

  switch (value) {
    case "Not Processed":
      return { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" } as const;
    case "Processing":
    case "Dispatched":
      return { backgroundColor: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd" } as const;
    case "Cancelled":
      return { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" } as const;
    case "Completed":
      return { backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac" } as const;
    default:
      return { backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" } as const;
  }
}

function Pill({ label, style }: { label: string; style: React.CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

type RowProps = { row: AdminOrderVM };

function Row({ row }: RowProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<OrderStatus>(
    (row.status as OrderStatus) ?? "Not Processed"
  );
  const [isSavingStatus, setIsSavingStatus] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>(
    row.isPaid ? "paid" : "unpaid"
  );
  const [isSavingPayment, setIsSavingPayment] = React.useState(false);

  const verifiedIcon = "/images/verified.png";
  const unverifiedIcon = "/images/unverified.png";

  const shippingName = [
    row.shippingAddress?.firstName,
    row.shippingAddress?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const shippingLines = [
    row.shippingAddress?.address1,
    row.shippingAddress?.address2,
    [row.shippingAddress?.state, row.shippingAddress?.city]
      .filter(Boolean)
      .join(", "),
    row.shippingAddress?.country,
    row.shippingAddress?.zipCode,
    row.shippingAddress?.phoneNumber,
  ].filter((value): value is string => Boolean(value && value.trim()));

  React.useEffect(() => {
    setStatus((row.status as OrderStatus) ?? "Not Processed");
  }, [row.status]);

  React.useEffect(() => {
    setPaymentStatus(row.isPaid ? "paid" : "unpaid");
  }, [row.isPaid]);

  async function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.target.value as OrderStatus;
    const previousStatus = status;

    setStatus(nextStatus);
    setIsSavingStatus(true);

    try {
      const response = await fetch(`/api/admin/orders/${row._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; status?: OrderStatus }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update order status.");
      }

      setStatus((data?.status as OrderStatus) ?? nextStatus);
      toast.success("Order status updated successfully.");
    } catch (error) {
      setStatus(previousStatus);
      toast.error(
        error instanceof Error ? error.message : "Failed to update order status."
      );
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handlePaymentStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextPaymentStatus = event.target.value as PaymentStatus;
    const previousPaymentStatus = paymentStatus;

    setPaymentStatus(nextPaymentStatus);
    setIsSavingPayment(true);

    try {
      const response = await fetch(`/api/admin/orders/${row._id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: nextPaymentStatus }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; isPaid?: boolean }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update payment status.");
      }

      setPaymentStatus(data?.isPaid ? "paid" : "unpaid");
      toast.success("Payment status updated successfully.");
    } catch (error) {
      setPaymentStatus(previousPaymentStatus);
      toast.error(
        error instanceof Error ? error.message : "Failed to update payment status."
      );
    } finally {
      setIsSavingPayment(false);
    }
  }

  const isPaidNow = paymentStatus === "paid";

  return (
    <>
      <tr
        style={{
          backgroundColor: open ? "rgba(59, 130, 246, 0.03)" : "transparent",
          transition: "background-color 0.2s ease",
        }}
      >
        <td style={{ padding: 12, width: 56, borderBottom: open ? "none" : "1px solid #e5e7eb" }}>
          <button
            aria-label="expand row"
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${open ? "#3b82f6" : "#d1d5db"}`,
              backgroundColor: open ? "rgba(59, 130, 246, 0.08)" : "transparent",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            {open ? "−" : "+"}
          </button>
        </td>

        <td style={{ padding: 12, minWidth: 220, borderBottom: open ? "none" : "1px solid #e5e7eb" }}>
          <span
            title={row._id}
            style={{ fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}
          >
            {row._id}
          </span>
        </td>

        <td style={{ padding: 12, minWidth: 180, borderBottom: open ? "none" : "1px solid #e5e7eb" }}>
          <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
            {formatPaymentLabel(row.paymentMethod)}
          </span>
        </td>

        <td style={{ padding: 12, minWidth: 140, borderBottom: open ? "none" : "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image
              src={isPaidNow ? verifiedIcon : unverifiedIcon}
              alt={isPaidNow ? "Paid" : "Unpaid"}
              width={18}
              height={18}
              sizes="18px"
              className={styles.ver}
            />
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
              {isPaidNow ? "Paid" : "Unpaid"}
            </span>
            {isSavingPayment ? <span style={{ fontSize: 12, color: "#6b7280" }}>Saving...</span> : null}
          </div>
        </td>

        <td style={{ padding: 12, minWidth: 190, borderBottom: open ? "none" : "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill label={status} style={chipStyles("status", status)} />
            {isSavingStatus ? <span style={{ fontSize: 12, color: "#6b7280" }}>Saving...</span> : null}
          </div>
        </td>

        <td style={{ padding: 12, minWidth: 140, borderBottom: open ? "none" : "1px solid #e5e7eb" }}>
          {row.couponCode ? (
            <Pill label={row.couponCode} style={chipStyles("coupon", row.couponCode)} />
          ) : (
            <span style={{ color: "#6b7280" }}>{row.couponApplied ? "Applied" : "-"}</span>
          )}
        </td>

        <td style={{ padding: 12, minWidth: 120, textAlign: "right", borderBottom: open ? "none" : "1px solid #e5e7eb" }}>
          <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>
            {typeof row.total === "number" ? `${row.total}$` : "-"}
          </span>
        </td>
      </tr>

      {open ? (
        <tr>
          <td colSpan={7} style={{ padding: 12, paddingTop: 0 }}>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#fff",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  background: "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Order details</div>
                  <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                    Review customer info, update order status, payment status, and inspect purchased items.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill label={`Items: ${row.products?.length ?? 0}`} style={{ backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db" }} />
                  <Pill label={`Total: ${typeof row.total === "number" ? `${row.total}$` : "-"}`} style={{ backgroundColor: "#f3f4f6", color: "#111827", border: "1px solid #d1d5db" }} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e5e7eb", padding: 16, display: "grid", gridTemplateColumns: "minmax(320px, 380px) 1fr", gap: 16 }}>
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Order status</div>
                    <select
                      value={status}
                      onChange={handleStatusChange}
                      disabled={isSavingStatus}
                      style={{ width: "100%", minHeight: 38, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 10px" }}
                    >
                      <option value="Not Processed">Not Processed</option>
                      <option value="Processing">Processing</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                      <Pill label={status} style={chipStyles("status", status)} />
                      {isSavingStatus ? <span style={{ fontSize: 12, color: "#6b7280" }}>Saving...</span> : null}
                    </div>
                  </div>

                  <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Payment status</div>
                    <select
                      value={paymentStatus}
                      onChange={handlePaymentStatusChange}
                      disabled={isSavingPayment}
                      style={{ width: "100%", minHeight: 38, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 10px" }}
                    >
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                      <Pill
                        label={isPaidNow ? "Paid" : "Unpaid"}
                        style={chipStyles("paid", isPaidNow ? "Paid" : "Unpaid")}
                      />
                      {isSavingPayment ? <span style={{ fontSize: 12, color: "#6b7280" }}>Saving...</span> : null}
                    </div>
                  </div>

                  <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Shipping address</div>
                    {shippingName ? (
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{shippingName}</div>
                    ) : null}

                    {shippingLines.length ? (
                      <div style={{ display: "grid", gap: 4 }}>
                        {shippingLines.map((line, index) => (
                          <div key={`${row._id}-shipping-${index}`} style={{ color: "#6b7280", fontSize: 14 }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#6b7280", fontSize: 14 }}>
                        No shipping information available.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>
                    Order items
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 12, width: 72 }}>Item</th>
                          <th style={{ textAlign: "left", padding: 12 }}>Name</th>
                          <th style={{ textAlign: "left", padding: 12 }}>Size</th>
                          <th style={{ textAlign: "left", padding: 12 }}>Qty</th>
                          <th style={{ textAlign: "left", padding: 12 }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(row.products ?? []).map((p) => (
                          <tr key={p._id}>
                            <td style={{ padding: 12, borderTop: "1px solid #f3f4f6" }}>
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={p.name ?? "Product image"}
                                  width={56}
                                  height={56}
                                  sizes="56px"
                                  className={styles.table__productImg}
                                />
                              ) : (
                                <span className={styles.table__productImg_placeholder} />
                              )}
                            </td>
                            <td style={{ padding: 12, borderTop: "1px solid #f3f4f6", fontWeight: 600 }}>
                              {p.name ?? "-"}
                            </td>
                            <td style={{ padding: 12, borderTop: "1px solid #f3f4f6" }}>
                              {p.size !== undefined ? String(p.size) : "-"}
                            </td>
                            <td style={{ padding: 12, borderTop: "1px solid #f3f4f6" }}>x{p.qty ?? 0}</td>
                            <td style={{ padding: 12, borderTop: "1px solid #f3f4f6" }}>
                              {typeof p.price === "number" ? `${p.price}$` : "-"}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} />
                          <td style={{ padding: 12, fontWeight: 700 }}>Total</td>
                          <td style={{ padding: 12, fontWeight: 800, fontSize: 16 }}>
                            {typeof row.total === "number" ? `${row.total}$` : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

type CollapsibleTableProps = {
  rows: AdminOrderVM[];
};

export function CollapsibleTable({ rows }: CollapsibleTableProps): React.JSX.Element {
  const [statusFilter, setStatusFilter] = React.useState<"all" | OrderStatus>("all");
  const [paidFilter, setPaidFilter] = React.useState<"all" | "paid" | "unpaid">("all");
  const [couponFilter, setCouponFilter] = React.useState<"all" | "applied" | "none">("all");

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : (row.status ?? "Not Processed") === statusFilter;

      const matchesPaid =
        paidFilter === "all"
          ? true
          : paidFilter === "paid"
          ? row.isPaid === true
          : row.isPaid === false;

      const hasCoupon = Boolean(row.couponCode || row.couponApplied);
      const matchesCoupon =
        couponFilter === "all"
          ? true
          : couponFilter === "applied"
          ? hasCoupon
          : !hasCoupon;

      return matchesStatus && matchesPaid && matchesCoupon;
    });
  }, [rows, statusFilter, paidFilter, couponFilter]);

  return (
    <div
      style={{
        borderRadius: 24,
        overflowX: "auto",
        backgroundColor: "#fff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Orders</div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Track payments, coupon usage, order status, and purchased items.
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
              style={{ width: "100%", minHeight: 38, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 10px" }}
            >
              <option value="all">All statuses</option>
              <option value="Not Processed">Not Processed</option>
              <option value="Processing">Processing</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Payment</label>
            <select
              value={paidFilter}
              onChange={(event) => setPaidFilter(event.target.value as "all" | "paid" | "unpaid")}
              style={{ width: "100%", minHeight: 38, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 10px" }}
            >
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Coupon</label>
            <select
              value={couponFilter}
              onChange={(event) => setCouponFilter(event.target.value as "all" | "applied" | "none")}
              style={{ width: "100%", minHeight: 38, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 10px" }}
            >
              <option value="all">All orders</option>
              <option value="applied">Coupon applied</option>
              <option value="none">No coupon</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label={`Total: ${rows.length}`} style={{ backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db" }} />
            <Pill label={`Shown: ${filteredRows.length}`} style={{ backgroundColor: "#f3f4f6", color: "#111827", border: "1px solid #d1d5db" }} />
          </div>
        </div>
      </div>

      <table className={styles.table} style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#3b82f6", color: "#fff" }}>
            <th style={{ width: 56, padding: "14px 12px" }} />
            <th style={{ padding: "14px 12px", textAlign: "left", whiteSpace: "nowrap" }}>Order</th>
            <th style={{ padding: "14px 12px", textAlign: "left", whiteSpace: "nowrap" }}>Payment Method</th>
            <th style={{ padding: "14px 12px", textAlign: "left", whiteSpace: "nowrap" }}>Paid</th>
            <th style={{ padding: "14px 12px", textAlign: "left", whiteSpace: "nowrap" }}>Status</th>
            <th style={{ padding: "14px 12px", textAlign: "left", whiteSpace: "nowrap" }}>Coupon</th>
            <th style={{ padding: "14px 12px", textAlign: "right", whiteSpace: "nowrap" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length ? (
            filteredRows.map((row) => <Row key={row._id} row={row} />)
          ) : (
            <tr>
              <td colSpan={7} style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontWeight: 600 }}>No orders match the selected filters.</div>
                <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                  Try changing the status, payment, or coupon filters.
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}