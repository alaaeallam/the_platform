// components/inputs/adminInput/index.tsx
"use client";

import React, { InputHTMLAttributes } from "react";
import { ErrorMessage, useField } from "formik";
import styles from "./styles.module.scss";

type AdminInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
  /** Formik field name (required) */
  name: string;
  /** Visible label for the input (required) */
  label: string;
};

export default function AdminInput({
  label,
  id,
  type = "text",
  ...props
}: AdminInputProps): React.JSX.Element {
  // Tell Formik which field to bind to (and its type for proper onChange casting)
  const [field, meta] = useField<string>({ name: props.name, type });

  const inputId = id ?? props.name;
  const hasError = Boolean(meta.touched && meta.error);

  return (
    <div className={styles.field}>
      <label
        className={`${styles.label} ${hasError ? styles.inputError : ""}`}
        htmlFor={inputId}
      >
        <span>{label}</span>
        <input
          id={inputId}
          type={type}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          // Bind Formik’s value/onChange/onBlur
          {...field}
          // Allow consumer overrides (placeholder, autoComplete, etc.)
          {...props}
        />
      </label>

      {hasError && (
        <div id={`${inputId}-error`} className={styles.inputError__msg}>
          <span />
          <ErrorMessage name={field.name} />
        </div>
      )}
    </div>
  );
}