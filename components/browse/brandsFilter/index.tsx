'use client';


import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";

type ReplaceResult = { result: string; active: boolean };

interface BrandsFilterProps {
  brands: string[];
  /** Updates the URL query for brand; pass empty string to clear */
  brandHandler: (value: string) => void;
  /** Computes the next brand query string and whether it's active */
  replaceQuery: (queryName: "brand", value: string) => ReplaceResult;
}

export default function BrandsFilter({
  brands,
  brandHandler,
  replaceQuery,
}: BrandsFilterProps): React.JSX.Element {
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
        Brands <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show && (
        <div className={styles.filter__sizes}>
          {brands.map((brand) => {
            const check = replaceQuery("brand", brand);
            return (
              <button
                key={brand}
                type="button"
                className={`${styles.filter__brand} ${
                  check.active ? styles.activeFilter : ""
                }`}
                aria-pressed={check.active}
                aria-label={`Filter by brand ${brand}`}
                onClick={() => brandHandler(check.result)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`../../../images/brands/${brand}.png`}
                  alt={`${brand} logo`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}