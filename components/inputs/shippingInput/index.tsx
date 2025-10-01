// components/inputs/shippingInput/index.tsx
"use client";

import * as React from "react";
import { useField, ErrorMessage } from "formik";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
interface ShippingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string; // required by Formik
  placeholder: string;
}

/* ---------- Component ---------- */
export default function ShippingInput({
  placeholder,
  ...props
}: ShippingInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [field, meta] = useField(props.name);
  const [move, setMove] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMove(!!field.value && String(field.value).length > 0);
  }, [field.value]);

  return (
    <div
      className={`${styles.input} ${
        meta.touched && meta.error ? styles.error__shipping : ""
      }`}
    >
      <div
        className={styles.input__wrapper}
        onFocus={() => setMove(true)}
        onBlur={() => setMove(!!field.value && String(field.value).length > 0)}
      >
        <input
          ref={inputRef}
          {...field}
          {...props}
          type={props.type ?? "text"}
          aria-invalid={!!(meta.touched && meta.error)}
          aria-describedby={`${field.name}-error`}
        />
        <span
          className={move ? styles.move : ""}
          onClick={() => {
            inputRef.current?.focus();
            setMove(true);
          }}
        >
          {placeholder}
        </span>
      </div>
      {meta.touched && meta.error && (
        <p id={`${field.name}-error`} className={styles.error__text}>
          <ErrorMessage name={field.name} />
        </p>
      )}
    </div>
  );
}