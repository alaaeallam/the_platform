"use client";

import React from "react";
import styles from "../styles.module.scss";

export type SizeProps = {
  size: string;
  /** Marks the chip as active/selected in the UI */
  checked?: boolean;
};

export default function Size({ size, checked = false }: SizeProps): React.JSX.Element {
  const id = `size-${size}`;
  return (
    <label htmlFor={id} className={styles.filter__sizes_size} aria-pressed={checked}>
      <input type="checkbox" id={id} name="size" defaultChecked={checked} />
      <span>{size}</span>
    </label>
  );
}