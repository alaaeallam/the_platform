"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import styles from "./styles.module.scss";

type Option = {
  _id: string;
  name: string;
};

interface MultipleSelectProps {
  data: Option[];
  value: string[];
  name: string;
  header: string;
  disabled?: boolean;
  handleChange: (event: SelectChangeEvent<string[]>) => void;
  [key: string]: unknown;
}

export default function MultipleSelect({
  data,
  handleChange,
  value,
  name,
  header,
  disabled,
  ...rest
}: MultipleSelectProps): React.JSX.Element {
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

  return (
    <div style={{ width: "100%", marginBottom: "1.25rem" }}>
      <div className={styles.header} style={{ marginBottom: "0.75rem" }}>
        <div className={styles.flex} style={{ fontSize: "1rem", fontWeight: 700 }}>
          {header}
        </div>
        <span />
      </div>

      <FormControl fullWidth disabled={disabled} sx={{ width: "100%" }}>
        <InputLabel id={`${name}-label`}>Select options</InputLabel>
        <Select
          multiple
          value={value}
          onChange={handleChange}
          name={name}
          labelId={`${name}-label`}
          input={<OutlinedInput label="Select options" />}
          renderValue={(selected) => {
            const ids = (selected as string[]) || [];
            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {ids.map((id) => (
                  <Chip
                    key={id}
                    label={labelById[id] ?? id}
                    sx={{ borderRadius: "999px" }}
                  />
                ))}
              </Box>
            );
          }}
          sx={{
            width: "100%",
            minHeight: 56,
            borderRadius: "12px",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#d1d5db",
            },
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