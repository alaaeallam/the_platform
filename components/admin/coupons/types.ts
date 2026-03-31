// components/admin/coupons/types.ts

/** UI shape for a coupon item used across the admin UI */
export interface CouponVM {
  _id: string;
  coupon: string;
  discount: number; // 0..100 (%)

  // dates
  startDate?: string | null; // ISO string or null
  endDate?: string | null;   // ISO string or null

  // status
  isActive?: boolean;
  isFeatured?: boolean;

  // analytics (basic for now)
  usageLimit?: number | null;
  usedCount?: number | null;

  // optional marketing fields
  description?: string | null;
  href?: string | null;

  // meta
  createdAt?: string;
  updatedAt?: string;
}

/** API list response shape */
export interface CouponListResponse {
  message?: string;
  coupons: CouponVM[];
}