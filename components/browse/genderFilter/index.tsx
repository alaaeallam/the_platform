"use client";

import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";
import React from "react";
type ReplaceResult = { result: string; active: boolean };

interface GenderFilterProps {
  /** Update the URL/query with the new gender filter; pass empty string to clear */
  genderHandler: (value: string) => void;
  /** Compute the next query value for a gender and whether it is active */
  replaceQuery: (queryName: "gender", value: string) => ReplaceResult;
}

const GENDERS = ["Men", "Women", "Unisex"] as const;

export default function GenderFilter({
  genderHandler,
  replaceQuery,
}: GenderFilterProps): React.JSX.Element {
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
        Gender <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show && (
        <div className={styles.filter__sizes}>
          {GENDERS.map((gender) => {
            const check = replaceQuery("gender", gender);
            return (
              <button
                key={gender}
                type="button"
                className={styles.filter__sizes_size}
                aria-pressed={check.active}
                onClick={() => genderHandler(check.result)}
              >
                <input
                  type="checkbox"
                  name="gender"
                  id={`gender-${gender}`}
                  checked={check.active}
                  readOnly
                />
                <label htmlFor={`gender-${gender}`}>{gender}</label>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
