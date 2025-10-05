"use client";

import * as React from "react";
import ListItem from "./ListItem";
import styles from "./styles.module.scss";
import type { CategoryVM } from "./types";

interface ListProps {
  categories: CategoryVM[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryVM[]>>;
}

export default function List({
  categories,
  setCategories,
}: ListProps): React.JSX.Element {
  return (
    <ul className={styles.list}>
      {categories.map((category: CategoryVM) => (
        <ListItem
          key={category._id}
          category={category}
          setCategories={setCategories}
        />
      ))}
    </ul>
  );
}