"use client";

import { useState } from "react";
import styles from "./styles.module.scss";
import TableSelect from "./TableSelect";

/* ---------- Types ---------- */
export interface RatingOption {
  text: string;
  value: number | "";
}

export interface OrderOption {
  text: string;
  value: string;
}

export interface SizeVM {
  size: string;
}

export interface ColorVM {
  color?: string;
  image?: string;
}

export interface TableHeaderProps {
  reviews: unknown[]; // if you have a ReviewVM type, replace with ReviewVM[]
  allSizes: SizeVM[];
  colors: ColorVM[];
}

/* ---------- Constants ---------- */
const ratings: RatingOption[] = [
  { text: "All", value: "" },
  { text: "5 star", value: 5 },
  { text: "4 star", value: 4 },
  { text: "3 star", value: 3 },
  { text: "2 star", value: 2 },
  { text: "1 star", value: 1 },
];

const orderOptions: OrderOption[] = [
  { text: "Recommended", value: "Recommended" },
  { text: "Most recent to oldest", value: "Most recent to oldest" },
  { text: "Oldest to most recent", value: "Oldest to most recent" },
];

/* ---------- Component ---------- */
export default function TableHeader({
  reviews,
  allSizes,
  colors,
}: TableHeaderProps): React.JSX.Element {
  const [rating, setRating] = useState<number | "">("");
  const [size, setSize] = useState<string>("");
  const [style, setStyle] = useState<ColorVM | null>(null);
  const [order, setOrder] = useState<string>("");

  return (
    <div className={styles.table__header}>
      <TableSelect
        property={rating}
        text="Rating"
        data={ratings.filter((x) => x.value !== rating)}
        handleChange={setRating}
      />

      <TableSelect
        property={size}
        text="Size"
        data={allSizes.filter((x) => x.size !== size)}
        handleChange={setSize}
      />

      <TableSelect
        property={style}
        text="Style"
        data={colors.filter((x) => x !== style)}
        handleChange={setStyle}
      />

      <TableSelect
        property={order}
        text="Order"
        data={orderOptions.filter((x) => x.value !== order)}
        handleChange={setOrder}
      />
    </div>
  );
}