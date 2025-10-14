"use client";

import { useState } from "react";
import { BsPlusLg } from "react-icons/bs";
import { FaMinus } from "react-icons/fa";
import styles from "../styles.module.scss";

type ReplaceResult = { result: string; active: boolean };

interface Category {
  _id: string;
  name: string;
}

interface CardProps {
  category: Category;
  categoryHandler: (id: string) => void;
  replaceQuery: (queryName: "category", value: string) => ReplaceResult;
}

export default function Card({ category, categoryHandler, replaceQuery }: CardProps): React.JSX.Element {
  const [show, setShow] = useState<boolean>(false);
  const check = replaceQuery("category", category._id);

  const toggle = () => setShow((prev) => !prev);

  return (
    <li className={styles.categoryItem}>
      <button
        type="button"
        onClick={() => categoryHandler(category._id)}
        aria-pressed={check.active}
        className={styles.categoryButton}
      >
        <input
          type="radio"
          name="filter"
          id={category._id}
          checked={check.active}
          readOnly
        />
        <label htmlFor={category._id}>{category.name}</label>
      </button>

      <span
        role="button"
        tabIndex={0}
        aria-expanded={show}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") toggle();
        }}
        className={styles.toggleIcon}
      >
        {show ? <FaMinus /> : <BsPlusLg />}
      </span>
    </li>
  );
}
