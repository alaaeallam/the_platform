"use client";

import * as React from "react";
import axios from "axios";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import type { CouponVM, CouponListResponse } from "./types";

/** Convert ISO -> yyyy-mm-dd for date inputs */
function toInputDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDateRange(start?: string | null, end?: string | null): string {
  const startText = toInputDate(start);
  const endText = toInputDate(end);

  if (startText && endText) return `${startText} → ${endText}`;
  if (startText) return `From ${startText}`;
  if (endText) return `Until ${endText}`;
  return "No date limits";
}

function formatUsage(usedCount?: number | null, usageLimit?: number | null): string {
  const used = usedCount ?? 0;
  if (usageLimit === null || usageLimit === undefined) return `${used} / Unlimited`;
  return `${used} / ${usageLimit}`;
}

interface Props {
  coupon: CouponVM;
  setCoupons: React.Dispatch<React.SetStateAction<CouponVM[]>>;
}

export default function ListItem({ coupon, setCoupons }: Props): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [busyAction, setBusyAction] = React.useState<"toggle" | "feature" | null>(null);

  const [code, setCode] = React.useState<string>("");
  const [discount, setDiscount] = React.useState<number | "">("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [usageLimit, setUsageLimit] = React.useState<number | "">("");

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setCode(coupon.coupon);
    setDiscount(coupon.discount);
    setStartDate(toInputDate(coupon.startDate));
    setEndDate(toInputDate(coupon.endDate));
    setUsageLimit(coupon.usageLimit ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const { data } = await axios.delete<CouponListResponse>("/api/admin/coupons", {
        data: { id },
      });
      setCoupons(data.coupons);
      toast.success(data.message ?? "Coupon deleted.");
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to delete coupon.";
      toast.error(msg);
    }
  };

  const handleUpdate = async (id: string): Promise<void> => {
    try {
      const payload = {
        id,
        coupon: code.trim() || coupon.coupon,
        discount: discount === "" ? coupon.discount : Number(discount),
        startDate: startDate || null,
        endDate: endDate || null,
        isActive: coupon.isActive ?? true,
        isFeatured: coupon.isFeatured ?? false,
        usageLimit: usageLimit === "" ? undefined : Number(usageLimit),
        usedCount: coupon.usedCount ?? 0,
        description: coupon.description ?? null,
        href: coupon.href ?? null,
      };

      const { data } = await axios.put<CouponListResponse>("/api/admin/coupons", payload);
      setCoupons(data.coupons);
      setOpen(false);
      toast.success(data.message ?? "Coupon updated.");
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to update coupon.";
      toast.error(msg);
    }
  };

  const handleToggleActive = async (): Promise<void> => {
    try {
      setBusyAction("toggle");
      const { data } = await axios.patch<CouponListResponse>(
        `/api/admin/coupons/${coupon._id}/toggle`
      );
      setCoupons(data.coupons);
      toast.success(data.message ?? "Coupon status updated.");
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to update coupon status.";
      toast.error(msg);
    } finally {
      setBusyAction(null);
    }
  };

  const handleFeature = async (): Promise<void> => {
    try {
      setBusyAction("feature");
      const { data } = await axios.patch<CouponListResponse>(
        `/api/admin/coupons/${coupon._id}/feature`
      );
      setCoupons(data.coupons);
      toast.success(data.message ?? "Featured coupon updated.");
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to set featured coupon.";
      toast.error(msg);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <li className={styles.list__item}>
      {!open ? (
        <div className={styles.row}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={coupon.coupon}
            disabled
            aria-label="Coupon code"
          />

          <input
            className={styles.inputNum}
            type="number"
            value={coupon.discount}
            disabled
            aria-label="Discount percent"
          />

          <span className={[styles.btn, styles.badge].filter(Boolean).join(" ")}>
            {coupon.isActive ? "Active" : "Inactive"}
          </span>
          <span className={[styles.btn, styles.badge].filter(Boolean).join(" ")}>
            {coupon.isFeatured ? "Featured" : "Standard"}
          </span>
          <span className={styles.btn}>{formatDateRange(coupon.startDate, coupon.endDate)}</span>
          <span className={[styles.btn, styles.badge].filter(Boolean).join(" ")}>
            {formatUsage(coupon.usedCount, coupon.usageLimit)}
          </span>

          <div className={styles.list__item_actions}>
            <button
              type="button"
              className={styles.btn}
              onClick={handleToggleActive}
              disabled={busyAction !== null}
            >
              {busyAction === "toggle"
                ? "..."
                : coupon.isActive
                  ? "Off"
                  : "On"}
            </button>

            <button
              type="button"
              className={styles.btn}
              onClick={handleFeature}
              disabled={busyAction !== null || Boolean(coupon.isFeatured)}
            >
                            {busyAction === "feature"
                ? "..."
                : coupon.isFeatured
                  ? "★"
                  : "☆"}
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Edit coupon"
              onClick={handleOpen}
            >
              <AiTwotoneEdit />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Delete coupon"
              onClick={() => handleDelete(coupon._id)}
            >
              <AiFillDelete />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.row}>
            <input
              ref={inputRef}
              className={`${styles.input} ${styles.open}`}
              type="text"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              aria-label="Coupon code"
            />

            <input
              className={`${styles.inputNum} ${styles.open}`}
              type="number"
              value={discount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDiscount(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
              max={100}
              aria-label="Discount percent"
            />

            <span className={[styles.btn, styles.badge].filter(Boolean).join(" ")}>
              {coupon.isActive ? "Active" : "Inactive"}
            </span>
            <span className={[styles.btn, styles.badge].filter(Boolean).join(" ")}>
              {coupon.isFeatured ? "Featured" : "Standard"}
            </span>

            <div className={styles.dateCell}>
              <input
                className={`${styles.input} ${styles.open}`}
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                aria-label="Start date"
              />
              <input
                className={`${styles.input} ${styles.open}`}
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                aria-label="End date"
              />
            </div>

            <input
              className={`${styles.inputNum} ${styles.open}`}
              type="number"
              value={usageLimit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={1}
              aria-label="Usage limit"
              placeholder="Unlimited"
            />

            <div className={styles.list__item_actions}>
              <button type="button" className={styles.btn} onClick={() => handleUpdate(coupon._id)}>
                Save
              </button>
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  setOpen(false);
                  setCode("");
                  setDiscount("");
                  setStartDate("");
                  setEndDate("");
                  setUsageLimit("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Delete coupon"
                onClick={() => handleDelete(coupon._id)}
              >
                <AiFillDelete />
              </button>
            </div>
          </div>
        </>
      )}
    </li>
  );
}