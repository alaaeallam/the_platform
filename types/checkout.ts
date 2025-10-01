// types/checkout.ts

/* ---------- Basic helpers ---------- */
export type ObjectIdString = string;

/* ---------- Address / User ---------- */

export interface Address {
  _id?: ObjectIdString;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  state: string;
  city: string;
  zipCode: string;
  address1: string;
  address2?: string;
  country: string;
  active?: boolean;
}

export interface UserVM {
  _id: ObjectIdString;
  name?: string;
  email?: string;
  image?: string;
  /** Saved shipping addresses (optional to tolerate legacy payloads) */
  address?: Address[];
}

/* ---------- Cart / Lines ---------- */

export interface ProductColor {
  color?: string;
  image?: string;
}

export interface CartLine {
  _id?: ObjectIdString;

  /** Some payloads use productId, others product */
  productId?: ObjectIdString;
  product?: ObjectIdString;

  name: string;
  slug?: string;
  image: string;

  /** Color may be missing or null in old carts */
  color?: ProductColor | null;

  /** Size can be either a label or numeric (legacy) */
  size: string | number;

  /** Sub-product/style index if applicable */
  style?: number;

  /** Unit price for this size/style */
  price: number;

  /** Quantity selected */
  qty: number;
}

export interface CartVM {
  _id?: ObjectIdString;
  user?: ObjectIdString;
  products: CartLine[];
  /** Sum of line (price * qty) before coupon */
  cartTotal: number;
  /** Optional discounted total after coupon */
  totalAfterDiscount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/* ---------- Payments ---------- */

/**
 * Keep flexible: these ids should match your `data/paymentMethods`.
 * Add/remove literals as your app supports.
 */
export type PaymentMethod = "" | "visa" | "mastercard" | "stripe" | "paypal" | "cash";

/* ---------- Common payload helpers ---------- */

export interface AddressListPayload {
  addresses: Address[];
}

/* ---------- Coupon responses ---------- */

export interface CouponApplyOk {
  totalAfterDiscount: number;
  discount: number;
}

export interface CouponApplyErr {
  message: string;
}

/* ---------- Generic API result (optional but handy) ---------- */

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;