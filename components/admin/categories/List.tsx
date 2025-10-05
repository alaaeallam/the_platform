// components/admin/categories/List.tsx
"use client";

import ListItem from "./ListItem";
import styles from "./styles.module.scss";
import { useMemo } from "react";

/** Match the shape you use across Create/List/etc. */
export type CategoryVM = {
  _id: string;
  name: string;
  slug?: string;
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

interface ListProps {
  categories: CategoryVM[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryVM[]>>;
}

export default function List({
  categories,
  setCategories,
}: ListProps): React.JSX.Element {
  // Optional: memoize to avoid re-renders if the parent passes a new array reference
  const items = useMemo(() => categories, [categories]);

  return (
    <ul className={styles.list}>
      {items.map((category) => (
        <ListItem
          key={category._id}
          category={category}
          setCategories={setCategories}
        />
      ))}
    </ul>
  );
}