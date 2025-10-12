// app/components/admin/createProduct/clickToAdd/Details.tsx
"use client";

import * as React from "react";
import { BsFillPatchMinusFill, BsFillPatchPlusFill } from "react-icons/bs";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */

export type DetailRow = {
  name: string;
  value: string;
};

type Props<T extends { details: DetailRow[] }> = {
  details: DetailRow[];
  product: T;
  setProduct: React.Dispatch<React.SetStateAction<T>>;
};

/* ---------- Component (generic over T) ---------- */

export default function Details<T extends { details: DetailRow[] }>({
  details,
  product,
  setProduct,
}: Props<T>) {
  const addDetail = (): void => {
    setProduct((prev) => ({
      ...prev,
      details: [...prev.details, { name: "", value: "" }],
    }));
  };

  const removeDetail = (index: number): void => {
    setProduct((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const key = e.target.name as keyof DetailRow; // "name" | "value"
    const value = e.target.value;

    setProduct((prev) => {
      const next = prev.details.slice();
      next[index] = { ...next[index], [key]: value };
      return { ...prev, details: next };
    });
  };

  return (
    <div>
      <div className={styles.header}>Details</div>

      {details.length === 0 && (
        <BsFillPatchPlusFill className={styles.svg} onClick={addDetail} />
      )}

      {details.map((detail, i) => (
        <div className={styles.clicktoadd} key={i}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={detail.name}
            onChange={(e) => handleChange(i, e)}
          />
          <input
            type="text"
            name="value"
            placeholder="Value"
            value={detail.value}
            onChange={(e) => handleChange(i, e)}
          />
          <BsFillPatchMinusFill onClick={() => removeDetail(i)} />
          <BsFillPatchPlusFill onClick={addDetail} />
        </div>
      ))}
    </div>
  );
}