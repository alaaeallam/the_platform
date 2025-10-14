

"use client";

import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";

type ReplaceResult = { result: string; active: boolean };

interface PatternsFilterProps {
  patterns: string[];
  /** Update the URL/query with the new pattern filter; pass empty string to clear */
  patternHandler: (value: string) => void;
  /** Compute the next query value for a pattern and whether it is active */
  replaceQuery: (queryName: "pattern", value: string) => ReplaceResult;
}

export default function PatternsFilter({
  patterns,
  patternHandler,
  replaceQuery,
}: PatternsFilterProps): React.JSX.Element {
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
        Pattern <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show && (
        <div className={styles.filter__sizes}>
          {patterns.map((pattern, i) => {
            const check = replaceQuery("pattern", pattern);
            const label = pattern.length > 12 ? `${pattern.substring(0, 12)}...` : pattern;
            const inputId = `pattern-${i}`;
            return (
              <button
                key={`${pattern}-${i}`}
                type="button"
                className={styles.filter__sizes_size}
                aria-pressed={check.active}
                onClick={() => patternHandler(check.result)}
              >
                <input
                  type="checkbox"
                  name="pattern"
                  id={inputId}
                  checked={check.active}
                  readOnly
                />
                <label htmlFor={inputId}>{label}</label>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}