

"use client";

import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";

type ReplaceResult = { result: string; active: boolean };

interface MaterialsFilterProps {
  materials: string[];
  /** Update the URL/query with the new material filter; pass empty string to clear */
  materialHandler: (value: string) => void;
  /** Compute the next query value for a material and whether it is active */
  replaceQuery: (queryName: "material", value: string) => ReplaceResult;
}

export default function MaterialsFilter({
  materials,
  materialHandler,
  replaceQuery,
}: MaterialsFilterProps): React.JSX.Element {
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
        Material <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show && (
        <div className={styles.filter__sizes}>
          {materials.map((material, i) => {
            const check = replaceQuery("material", material);
            const label = material.length > 12 ? `${material.substring(0, 12)}...` : material;
            const inputId = `material-${material}-${i}`;
            return (
              <button
                key={`${material}-${i}`}
                type="button"
                className={styles.filter__sizes_size}
                aria-pressed={check.active}
                onClick={() => materialHandler(check.result)}
              >
                <input
                  type="checkbox"
                  name="material"
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