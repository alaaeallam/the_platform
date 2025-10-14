"use client";

import { useState } from "react";
import axios, { AxiosError } from "axios";
import Payment from "@/components/checkout/payment";
import styles from "@/app/styles/profile.module.scss";
import React from "react";
import type { PaymentMethod } from "@/types/checkout";

/* ---------- Props ---------- */
interface PaymentClientProps {
  /** Default payment method fetched from the database */
  defaultPaymentMethod: PaymentMethod;
}

/* ---------- Component ---------- */
export default function PaymentClient({
  defaultPaymentMethod,
}: PaymentClientProps): React.JSX.Element {
  const [dbPM, setDbPM] = useState<PaymentMethod>(defaultPaymentMethod);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(defaultPaymentMethod);
  const [error, setError] = useState<string>("");

  const handlePM = async (): Promise<void> => {
    try {
      const { data } = await axios.put<{ paymentMethod: PaymentMethod }>(
        "/api/user/changePM",
        { paymentMethod }
      );
      setError("");
      setDbPM(data.paymentMethod);
      window.location.reload();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message =
        axiosErr.response?.data?.message ?? "Failed to update payment method.";
      setError(message);
    }
  };

  return (
    <>
      <Payment
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        profile
      />

      <button
        disabled={!paymentMethod || paymentMethod === dbPM}
        className={`${styles.button} ${
          !paymentMethod || paymentMethod === dbPM ? styles.disabled : ""
        }`}
        onClick={handlePM}
      >
        Save
      </button>

      {error && <span className={styles.error}>{error}</span>}
    </>
  );
}