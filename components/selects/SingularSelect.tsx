// components/selects/SingularSelect.tsx
"use client";

import * as React from "react";
import { TextField, MenuItem } from "@mui/material";
import styles from "./styles.module.scss";

type Option = { _id?: string; name: string; code?: string };

interface SingularSelectProps {
  name: string;
  value: string;
  placeholder: string;
  data: Option[];
  header?: string;
  disabled?: boolean;
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
  return (
    <div style={{ width: "100%", marginBottom: "1.25rem" }}>
      {header && (
        <div className={styles.header} style={{ marginBottom: "0.75rem" }}>
          <div className={styles.flex} style={{ fontSize: "1rem", fontWeight: 700 }}>
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
        className={styles.select}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-root": {
            minHeight: 56,
            borderRadius: "12px",
            backgroundColor: "#fff",
          },
        }}
      >
        <MenuItem key="" value="">
          No Selected / Or Empty
        </MenuItem>

        {data.map((opt) => {
          const v = opt.code ?? opt._id ?? opt.name;
          return (
            <MenuItem key={v} value={v}>
              {opt.name}
            </MenuItem>
          );
        })}
      </TextField>
    </div>
  );
}