"use client";

import * as React from "react";
import ListItem from "./ListItem";
import styles from "./styles.module.scss";
import type { CouponVM } from "./types";

interface Props {
  coupons: CouponVM[];
  setCoupons: React.Dispatch<React.SetStateAction<CouponVM[]>>;
}

export default function List({ coupons, setCoupons }: Props): React.JSX.Element {
  if (!coupons?.length) {
    return <p className={styles.empty}>No coupons yet.</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.list__header}>
        <span>Code</span>
        <span>Discount</span>
        <span>Status</span>
        <span>Featured</span>
        <span>Dates</span>
        <span>Usage</span>
        <span>Actions</span>
      </div>

      {/* List */}
      <ul className={styles.list}>
        {coupons.map((c) => (
          <ListItem key={c._id} coupon={c} setCoupons={setCoupons} />
        ))}
      </ul>
    </div>
  );
}