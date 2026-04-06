// components/inputs/adminInput/index.tsx
"use client";

import React, { InputHTMLAttributes } from "react";
import styles from "./styles.module.scss";

type AdminInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
  name: string;
  label: string;
};

export default function AdminInput({
  label,
  id,
  type = "text",
  ...props
}: AdminInputProps): React.JSX.Element {
  const inputId = id ?? props.name;
  const hasError = false;
  const { name: _ignoredName, style: inputStyle, ...restProps } = props;

  return (
    <div
      className={styles.field}
      style={{
        width: "100%",
        marginBottom: "1rem",
      }}
    >
      <label
        className={`${styles.label} ${hasError ? styles.inputError : ""}`}
        htmlFor={inputId}
        style={{
          display: "grid",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {label}
        </span>
        <input
          id={inputId}
          type={type}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          name={inputId}
          {...restProps}
          style={{
            width: "100%",
            minHeight: "48px",
            padding: "0 14px",
            border: "1px solid #d1d5db",
            borderRadius: "12px",
            fontSize: "1rem",
            outline: "none",
            background: "#fff",
            boxSizing: "border-box",
            ...((inputStyle as React.CSSProperties | undefined) ?? {}),
          }}
        />
      </label>
      <></>
    </div>
  );
}