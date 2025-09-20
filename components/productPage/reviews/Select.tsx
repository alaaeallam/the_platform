"use client";

import { useState } from "react";
import { IoArrowDown } from "react-icons/io5";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
// type SelectKind = "Size" | "Style" | "How does it fit";

type SizeProps = {
  text: "Size";
  property: string;
  data: string[];                 // e.g. ["S","M","L"]
  handleChange: (val: string) => void;
};

type StyleProps = {
  text: "Style";
  property: string;               // e.g. "Red", "Green", or a label
  data: string[];                 // same — simple strings
  handleChange: (val: string) => void;
};

type FitProps = {
  text: "How does it fit";
  property: string;               // one of FITS
  data: readonly string[];        // ["Small","True to size","Large"]
  handleChange: (val: string) => void;
};

export type SelectProps = SizeProps | StyleProps | FitProps;

/* ---------- Component ---------- */
export default function Select(props: SelectProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);

  const label =
    props.property ||
    (props.text === "How does it fit" ? "How does it fit" : `Select ${props.text}`);

  const widthStyle = props.text === "How does it fit" ? undefined : undefined;

  return (
    <div className={styles.select}>
      {props.text}:
      <div
        className={styles.select__header}
        onMouseOver={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <span className={`${styles.flex} ${styles.select__header_wrap}`} style={{ padding: "0 5px" }}>
          {label}
          <IoArrowDown />
        </span>

        {visible && (
          <ul
            className={styles.select__header_menu}
            onMouseOver={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            style={widthStyle}
          >
            {props.data.map((item, i) => (
              <li key={i} onClick={() => props.handleChange(item)}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}