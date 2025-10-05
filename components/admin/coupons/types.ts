// components/admin/coupons/types.ts

/** UI shape for a coupon item used across the admin UI */
export interface CouponVM {
  _id: string;
  coupon: string;
  discount: number; // 0..100 (%)
  startDate?: string | null; // ISO string or null
  endDate?: string | null;   // ISO string or null
  createdAt?: string;
  updatedAt?: string;
}

/** API list response shape */
export interface CouponListResponse {
  message?: string;
  coupons: CouponVM[];
}