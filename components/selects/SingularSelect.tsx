// components/selects/SingularSelect.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { TextField, MenuItem } from "@mui/material";
import { ErrorMessage, useField } from "formik";
import styles from "./styles.module.scss";

type Option = { _id?: string; name: string };

interface SingularSelectProps {
  name: string;
  value: string;
  placeholder: string;
  data: Option[];
  header?: string;
  disabled?: boolean;
  /** <-- return just the selected value */
  handleChange: (value: string) => void;
}

export default function SingularSelect({
  name,
  value,
  placeholder,
  data,
  header,
  disabled,
  handleChange,
}: SingularSelectProps): React.JSX.Element {
  const [, meta] = useField<string>({ name });
  const hasError = Boolean(meta.touched && meta.error);

  return (
    <div style={{ marginBottom: "1rem" }}>
      {header && (
        <div className={`${styles.header} ${hasError ? styles.header__error : ""}`}>
          <div className={styles.flex}>
            {hasError && (
              <Image
                src="/images/warning.png"
                alt="Warning"
                width={16}
                height={16}
                className={styles.warningIcon}
              />
            )}
            {header}
          </div>
        </div>
      )}

      <TextField
        select
        fullWidth
        variant="outlined"
        name={name}
        label={placeholder}
        value={value}
        onChange={(e) => handleChange(String((e.target as HTMLInputElement).value))}
        disabled={disabled}
        className={`${styles.select} ${hasError ? styles.error__select : ""}`}
      >
        <MenuItem key="" value="">
          No Selected / Or Empty
        </MenuItem>

        {data.map((opt) => {
          const v = opt._id ?? opt.name;
          return (
            <MenuItem key={v} value={v}>
              {opt.name}
            </MenuItem>
          );
        })}
      </TextField>

      {hasError && (
        <p className={styles.error__msg}>
          <ErrorMessage name={name} />
        </p>
      )}
    </div>
  );
}