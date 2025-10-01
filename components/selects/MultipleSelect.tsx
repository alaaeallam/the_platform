// components/selects/MultipleSelect.tsx
"use client";

import * as React from "react";
import clsx from "clsx";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import { useField, ErrorMessage } from "formik";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */

type Option = {
  _id: string;
  name: string;
};

interface MultipleSelectProps {
  /** Array of options coming from the server */
  data: Option[];
  /** Controlled value: array of selected _id strings */
  value: string[];
  /** Field name (also used to hook into Formik meta) */
  name: string;
  /** Header label shown above the select */
  header: string;
  /** Disable the whole control */
  disabled?: boolean;
  /**
   * onChange handler for MUI v5 <Select multiple>.
   * Access selected ids via: `event.target.value as string[]`
   */
  handleChange: (event: SelectChangeEvent<string[]>) => void;
  /** Any extra props you might pass down to <Select> */
  [key: string]: unknown;
}

/* ---------- Component ---------- */

export default function MultipleSelect({
  data,
  handleChange,
  value,
  name,
  header,
  disabled,
  ...rest
}: MultipleSelectProps): React.JSX.Element {
  const theme = useTheme();
  const [, meta] = useField<string[]>({ name });

  // Build fast lookup of _id -> name
  const labelById = React.useMemo<Record<string, string>>(
    () =>
      Array.isArray(data)
        ? data.reduce((acc, cur) => {
            acc[cur._id] = cur.name;
            return acc;
          }, {} as Record<string, string>)
        : {},
    [data]
  );

  const hasError = Boolean(meta.touched && meta.error);

  return (
    <div>
      {/* Header + inline error */}
      <div className={clsx(styles.header, hasError && styles.header__error)}>
        <div className={styles.flex}>
          {hasError && <img src="../../../images/warning.png" alt="Warning" />}
          {header}
        </div>
        <span>
          {hasError && (
            <div className={styles.error__msg}>
              <span />
              <ErrorMessage name={name} />
            </div>
          )}
        </span>
      </div>

      <FormControl
        sx={{ m: 1, minWidth: 120, width: "100%" }}
        disabled={disabled}
        aria-invalid={hasError || undefined}
      >
        <Select
          multiple
          value={value}
          onChange={handleChange}
          name={name}
          input={<Input id={`${name}-multiple-chip`} />}
          renderValue={(selected) => {
            const ids = (selected as string[]) || [];
            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {ids.map((id) => (
                  <Chip key={id} label={labelById[id] ?? id} />
                ))}
              </Box>
            );
          }}
          {...rest}
        >
          {data.map((opt) => {
            const checked = value.includes(opt._id);
            return (
              <MenuItem key={opt._id} value={opt._id}>
                <Checkbox checked={checked} color="primary" />
                <ListItemText primary={opt.name} />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}