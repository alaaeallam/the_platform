"use client";

import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";
import Size from "./Size";

type ReplaceResult = { result: string; active: boolean };

interface SizesFilterProps {
  sizes: string[];
  /** Update the URL/query with the new size filter; pass empty string to clear */
  sizeHandler: (value: string) => void;
  /** Compute the next query value for a size and whether it is active */
  replaceQuery: (queryName: "size", value: string) => ReplaceResult;
}

export default function SizesFilter({
  sizes,
  sizeHandler,
  replaceQuery,
}: SizesFilterProps): React.JSX.Element {
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
        Sizes <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show && (
        <div className={styles.filter__sizes}>
          {sizes.map((size) => {
            const check = replaceQuery("size", size);
            return (
              <button
                key={size}
                type="button"
                className={styles.filter__sizes_size}
                aria-pressed={check.active}
                onClick={() => sizeHandler(check.result)}
              >
                <Size size={size} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
