// app/(admin)/admin/dashboard/coupons/CouponsClient.tsx
"use client";

import * as React from "react";
import Create from "@/components/admin/coupons/Create";
import List from "@/components/admin/coupons/List";
import type { CouponVM } from "./page";

interface Props {
  initialCoupons: CouponVM[];
}

export default function CouponsClient({ initialCoupons }: Props): React.JSX.Element {
  const [coupons, setCoupons] = React.useState<CouponVM[]>(initialCoupons);

  return (
    <div>
      <Create setCoupons={setCoupons} />
      <List coupons={coupons} setCoupons={setCoupons} />
    </div>
  );
}