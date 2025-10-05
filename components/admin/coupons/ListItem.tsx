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

interface Props {
  coupon: CouponVM;
  setCoupons: React.Dispatch<React.SetStateAction<CouponVM[]>>;
}

export default function ListItem({ coupon, setCoupons }: Props): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const [code, setCode] = React.useState<string>("");
  const [discount, setDiscount] = React.useState<number | "">("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Initialize edit fields when opening
  const handleOpen = () => {
    setOpen(true);
    setCode(coupon.coupon);
    setDiscount(coupon.discount);
    setStartDate(toInputDate(coupon.startDate));
    setEndDate(toInputDate(coupon.endDate));
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
        discount:
          discount === "" ? coupon.discount : Number(discount),
        startDate: startDate || null,
        endDate: endDate || null,
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

  return (
    <li className={styles.list__item}>
      <div className={styles.row}>
        <input
          ref={inputRef}
          className={`${styles.input} ${open ? styles.open : ""}`}
          type="text"
          value={open ? code : coupon.coupon}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
          disabled={!open}
          aria-label="Coupon code"
        />

        <input
          className={`${styles.inputNum} ${open ? styles.open : ""}`}
          type="number"
          value={open ? discount : coupon.discount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDiscount(e.target.value === "" ? "" : Number(e.target.value))
          }
          min={0}
          max={100}
          disabled={!open}
          aria-label="Discount percent"
        />
      </div>

      {open && (
        <div className={styles.row}>
          <input
            className={styles.input}
            type="date"
            value={startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            aria-label="Start date"
          />
          <input
            className={styles.input}
            type="date"
            value={endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            aria-label="End date"
          />
        </div>
      )}

      {open && (
        <div className={styles.list__item_expand}>
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
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className={styles.list__item_actions}>
        {!open && (
          <AiTwotoneEdit
            role="button"
            aria-label="Edit coupon"
            onClick={handleOpen}
          />
        )}
        <AiFillDelete
          role="button"
          aria-label="Delete coupon"
          onClick={() => handleDelete(coupon._id)}
        />
      </div>
    </li>
  );
}