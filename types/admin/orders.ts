// types/admin/orders.ts
export type OrderStatus =
  | "Not Processed"
  | "Processing"
  | "Dispatched"
  | "Cancelled"
  | "Completed";

export type PaymentMethod = "paypal" | "credit_card" | "cod" | string;

export interface AdminUserVM {
  _id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string; // legacy
}

export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phoneNumber?: string;
}

export interface OrderLineItem {
  _id: string;
  image?: string;
  name?: string;
  size?: string | number;
  qty?: number;
  price?: number;
}

export interface AdminOrderVM {
  _id: string;

  paymentMethod?: PaymentMethod | null;
  isPaid?: boolean | null;
  status?: OrderStatus | string | null;
  total?: number | null;

  // NEW: coupon fields
  couponCode?: string | null;        // e.g., "WELCOME30"
  couponApplied?: boolean | null;    // true/false if you track it

  user?: AdminUserVM | null;
  shippingAddress?: ShippingAddress | null;
  products?: OrderLineItem[] | null;

  createdAt?: string;
  updatedAt?: string;
}