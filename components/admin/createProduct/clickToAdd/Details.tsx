// app/components/admin/createProduct/clickToAdd/Details.tsx
"use client";

import * as React from "react";
import { BsFillPatchMinusFill, BsFillPatchPlusFill } from "react-icons/bs";
import styles from "./styles.module.scss";

export type DetailRow = {
  name: string;
  value: string;
};

type Props<T extends { details: DetailRow[] }> = {
  details: DetailRow[];
  product: T;
  setProduct: React.Dispatch<React.SetStateAction<T>>;
};

export default function Details<T extends { details: DetailRow[] }>({
  details,
  setProduct,
}: Props<T>) {
  const addDetail = (): void => {
    setProduct((prev) => ({
      ...prev,
      details: [...prev.details, { name: "", value: "" }],
    }));
  };

  const removeDetail = (index: number): void => {
    if (details.length <= 1) {
      setProduct((prev) => ({ ...prev, details: [] }));
      return;
    }

    setProduct((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const key = e.target.name as keyof DetailRow;
    const value = e.target.value;

    setProduct((prev) => {
      const next = prev.details.slice();
      next[index] = { ...next[index], [key]: value };
      return { ...prev, details: next };
    });
  };

  return (
    <div style={{ width: "100%", marginBottom: "1.5rem" }}>
      <div
        className={styles.header}
        style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 700 }}
      >
        Details
      </div>

      {details.length === 0 && (
        <button
          type="button"
          onClick={addDetail}
          style={{
            width: "42px",
            height: "42px",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#2563eb",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
          aria-label="Add detail row"
        >
          <BsFillPatchPlusFill />
        </button>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {details.map((detail, i) => (
          <div
            className={styles.clicktoadd}
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr)) auto auto",
              gap: "0.75rem",
              alignItems: "center",
              padding: "1rem",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              background: "#fff",
            }}
          >
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={detail.name}
              onChange={(e) => handleChange(i, e)}
              style={{
                width: "100%",
                minHeight: "48px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0 14px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
            <input
              type="text"
              name="value"
              placeholder="Value"
              value={detail.value}
              onChange={(e) => handleChange(i, e)}
              style={{
                width: "100%",
                minHeight: "48px",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0 14px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              onClick={() => removeDetail(i)}
              aria-label="Remove detail row"
              style={{
                width: "42px",
                height: "42px",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                background: "#fff1f2",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <BsFillPatchMinusFill />
            </button>

            <button
              type="button"
              onClick={addDetail}
              aria-label="Add detail row"
              style={{
                width: "42px",
                height: "42px",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <BsFillPatchPlusFill />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}