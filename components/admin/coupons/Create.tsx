"use client";

import * as React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";

import AdminInput from "@/components/inputs/adminInput";
import styles from "./styles.module.scss";
import type { CouponVM, CouponListResponse } from "./types";

type Props = {
  setCoupons: React.Dispatch<React.SetStateAction<CouponVM[]>>;
};

type FormValues = {
  coupon: string;
  discount: number | "";
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
};

const validationSchema = Yup.object({
  coupon: Yup.string()
    .trim()
    .required("Coupon code is required.")
    .max(64, "Coupon code must be at most 64 characters."),
  discount: Yup.number()
    .typeError("Discount must be a number.")
    .required("Discount is required.")
    .min(0, "Discount cannot be negative.")
    .max(100, "Discount cannot exceed 100%."),
  startDate: Yup.string().optional(),
  endDate: Yup.string().optional(),
}).test(
  "dates-order",
  "End date must be after or the same as start date.",
  (values) => {
    const { startDate, endDate } = values as FormValues;
    if (!startDate || !endDate) return true; // optional dates are allowed
    return new Date(endDate) >= new Date(startDate);
  }
);

export default function Create({ setCoupons }: Props): React.JSX.Element {
  const [coupon, setCoupon] = React.useState("");
  const [discount, setDiscount] = React.useState<number | "">("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  const initialValues: FormValues = { coupon, discount, startDate, endDate };

  const handleSubmit = async (): Promise<void> => {
    try {
      const payload = {
        coupon: coupon.trim(),
        discount: typeof discount === "string" ? Number(discount) : discount,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
    <Formik<FormValues>
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {() => (
        <Form>
          <div className={styles.header}>Create a Coupon</div>

          <AdminInput
            type="text"
            label="Coupon Code"
            name="coupon"
            placeholder="E.g. SAVE10"
            value={coupon}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCoupon(e.target.value)
            }
          />

          <AdminInput
            type="number"
            label="Discount (%)"
            name="discount"
            placeholder="0 - 100"
            value={discount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDiscount(e.target.value === "" ? "" : Number(e.target.value))
            }
          />

          <div className={styles.grid2}>
            <AdminInput
              type="date"
              label="Start Date"
              name="startDate"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartDate(e.target.value)
              }
            />
            <AdminInput
              type="date"
              label="End Date"
              name="endDate"
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEndDate(e.target.value)
              }
            />
          </div>

          <div className={styles.btnWrap}>
            <button type="submit" className={styles.btn}>
              <span>Add Coupon</span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}