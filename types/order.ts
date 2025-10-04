// types/order.ts
import type { Types } from "mongoose";

export type OrderStatus =
  | "Not Processed"
  | "Processing"
  | "Dispatched"
  | "Cancelled"
  | "Completed";

export type PaymentMethod = "paypal" | "credit_card" | "cash";

export interface OrderUserVM {
  _id: string;
  name: string;
  email: string;
  image: string;
}

export interface OrderProductVM {
  _id?: string; // if present on subdoc
  product: string; // ObjectId as string
  name: string;
  image: string;
  size?: string;
  qty: number;
  color?: { color?: string; image?: string };
  price: number;
}

export interface ShippingAddressVM {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderVM {
  _id: string;
  user: OrderUserVM;
  products: OrderProductVM[];
  shippingAddress: ShippingAddressVM;
  paymentMethod: PaymentMethod;

  total: number;
  totalBeforeDiscount?: number;
  couponApplied?: string;
  shippingPrice: number;
  taxPrice: number;

  isPaid: boolean;
  paidAt?: string;
  deliveredAt?: string;
  status: OrderStatus;

  createdAt: string;
  updatedAt: string;
}