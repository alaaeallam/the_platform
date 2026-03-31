"use client";

import * as React from "react";
import axios from "axios";
import { toast } from "react-toastify";

import styles from "./styles.module.scss";
import type { CouponVM, CouponListResponse } from "./types";

type Props = {
  setCoupons: React.Dispatch<React.SetStateAction<CouponVM[]>>;
};

export default function Create({ setCoupons }: Props): React.JSX.Element {
  const [coupon, setCoupon] = React.useState("");
  const [discount, setDiscount] = React.useState<number | "">("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [usageLimit, setUsageLimit] = React.useState<number | "">("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const payload = {
        coupon: coupon.trim(),
        discount: typeof discount === "string" ? Number(discount) : discount,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        usageLimit:
          usageLimit === "" ? undefined : Number(usageLimit),
      };

      const { data } = await axios.post<CouponListResponse>(
        "/api/admin/coupons",
        payload
      );
      setCoupons(data.coupons);
      setCoupon("");
      setDiscount("");
      setStartDate("");
      setEndDate("");
      setUsageLimit("");
      toast.success(data.message ?? "Coupon created successfully.");
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        (err as Error).message ||
        "Failed to create coupon.";
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.header}>Create a Coupon</div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="coupon-code">Coupon Code</label>
        <input
          id="coupon-code"
          className={styles.input}
          type="text"
          name="coupon"
          placeholder="E.g. SAVE10"
          value={coupon}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoupon(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="coupon-discount">Discount (%)</label>
        <input
          id="coupon-discount"
          className={styles.input}
          type="number"
          name="discount"
          placeholder="0 - 100"
          value={discount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDiscount(e.target.value === "" ? "" : Number(e.target.value))
          }
          min={0}
          max={100}
        />
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-start-date">Start Date</label>
          <input
            id="coupon-start-date"
            className={styles.input}
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-end-date">End Date</label>
          <input
            id="coupon-end-date"
            className={styles.input}
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="coupon-usage-limit">Usage Limit (Optional)</label>
        <input
          id="coupon-usage-limit"
          className={styles.input}
          type="number"
          name="usageLimit"
          placeholder="Leave empty for unlimited"
          value={usageLimit}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))
          }
          min={1}
        />
      </div>

      <div className={styles.btnWrap}>
        <button type="submit" className={ styles.submitBtn}>
          <span >Add Coupon</span>
        </button>
      </div>
    </form>
  );
}