"use client";

import { useState } from "react";
import { Pagination } from "@mui/material";
import styles from "./styles.module.scss";

import usePagination from "./Pagination";
import Review, { type ReviewVM } from "./Review";
import TableHeader from "./TableHeader";

/* ---------- Types ---------- */
export interface SizeVM {
  size: string;
}

export interface ColorVM {
  color?: string;
  image?: string;
}

export interface TableProps {
  reviews: ReviewVM[];
  allSizes: SizeVM[];
  colors: ColorVM[];
}

/* ---------- Component ---------- */
export default function Table({
  reviews,
  allSizes,
  colors,
}: TableProps): React.JSX.Element {
  const [page, setPage] = useState<number>(1);

  const PER_PAGE = 3;
  const count = Math.ceil(reviews.length / PER_PAGE);

  const paged = usePagination<ReviewVM>(reviews, PER_PAGE);

  const handleChange = (_e: React.ChangeEvent<unknown>, p: number): void => {
    setPage(p);
    paged.jump(p);
  };

  return (
    <div className={styles.table}>
      <TableHeader
        reviews={reviews}
        allSizes={[{ size: "All" }, ...allSizes]}
        colors={[{ color: "", image: "" }, ...colors]}
      />

      <div className={styles.table__data}>
        {paged.currentData().map((review, i) => (
          <Review review={review} key={review._id ?? `review-${i}`} />
        ))}
      </div>

      <div className={styles.pagination}>
        <Pagination
          count={count}
          page={page}
          shape="rounded"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}