"use client";

import * as React from "react";
import ListItem from "./ListItem";
import styles from "./styles.module.scss";
import type { CategoryVM, SubCategoryVM } from "./types";

interface ListProps {
  categories: CategoryVM[];
  subCategories: SubCategoryVM[];
  setSubCategories: React.Dispatch<React.SetStateAction<SubCategoryVM[]>>;
}

export default function List({
  categories,
  subCategories,
  setSubCategories,
}: ListProps): React.JSX.Element {
  return (
    <ul className={styles.list}>
      {subCategories.map((sub) => (
        <ListItem
          key={sub._id}
          subCategory={sub}
          categories={categories}
          setSubCategories={setSubCategories}
        />
      ))}
    </ul>
  );
}