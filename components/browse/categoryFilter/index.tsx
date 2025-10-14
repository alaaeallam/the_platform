// components/browse/categoryFilter/index.tsx
"use client";

import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";
import Card from "./Card";
import React from "react";
interface Category {
  _id: string;
  name: string;
}

type ReplaceResult = { result: string; active: boolean };

interface CategoryFilterProps {
  categories: Category[];
  /** Present in some callers, not used by Card/index */
  subCategories?: unknown[];
  /** Update the URL/query with the selected category id */
  categoryHandler: (id: string) => void;
  /** Compute the next value for a query param and whether it’s active */
  replaceQuery: (queryName: "category", value: string) => ReplaceResult;
}

export default function CategoryFilter({
  categories,
  categoryHandler,
  replaceQuery,
}: CategoryFilterProps): React.JSX.Element {
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
        Category <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show &&
        categories.map((category) => (
          <Card
            key={category._id}
            category={category}
            categoryHandler={categoryHandler}
            replaceQuery={replaceQuery}
          />
        ))}
    </div>
  );
}