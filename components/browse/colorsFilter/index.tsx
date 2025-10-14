

"use client";

import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";
import React from "react";
type ReplaceResult = { result: string; active: boolean };

interface ColorsFilterProps {
  colors: string[];
  /** Update the URL/query with the new color filter; pass empty string to clear */
  colorHandler: (value: string) => void;
  /** Compute the next query value for a color and whether it is active */
  replaceQuery: (queryName: "color", value: string) => ReplaceResult;
}

export default function ColorsFilter({
  colors,
  colorHandler,
  replaceQuery,
}: ColorsFilterProps): React.JSX.Element {
  const [show, setShow] = useState<boolean>(false);

  const toggle = () => setShow((prev) => !prev);

  return (
    <div className={styles.filter}>
      <h3
        role="button"
        tabIndex={0}
        aria-expanded={show}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") toggle();
        }}
      >
        Colors <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show && (
        <div className={styles.filter__colors}>
          {colors.map((color, i) => {
            const check = replaceQuery("color", color);
            return (
              <button
                key={`${color}-${i}`}
                type="button"
                style={{ background: color }}
                className={check.active ? styles.activeFilterColor : ""}
                aria-pressed={check.active}
                aria-label={`Filter by color ${color}`}
                onClick={() => colorHandler(check.result)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}