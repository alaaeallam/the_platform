// models/Order.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* -------------------- Interfaces -------------------- */

export interface IOrderColor {
  color?: string;
  image?: string;
}

export interface IOrderProduct {
  product: Types.ObjectId;
  name: string;
  image: string;
  size?: string;
  qty: number;
  color?: IOrderColor;
  price: number;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryCode: string;
}

export interface IPaymentResult {
  id?: string;
  status?: string;
  email?: string;
}

export interface IDeliverySnapshot {
  countryCode: string;
  countryName: string;
  fee: number;
  currency: string;
  freeShippingApplied: boolean;
  freeShippingThreshold?: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  ruleId: string;
}

export type OrderStatus =
  | "Not Processed"
  | "Processing"
  | "Dispatched"
  | "Cancelled"
  | "Completed";

export interface IOrder extends Document {
  user: Types.ObjectId;
  products: IOrderProduct[];
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  paymentResult?: IPaymentResult;

  total: number;
  totalBeforeDiscount?: number;
  couponApplied?: string;
  shippingPrice: number;
  delivery: IDeliverySnapshot;
  taxPrice: number;

  isPaid: boolean;
  paidAt?: Date;
  deliveredAt?: Date;
  status: OrderStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

/* -------------------- Sub-Schemas -------------------- */

const ColorSchema = new Schema<IOrderColor>(
  {
    color: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const OrderProductSchema = new Schema<IOrderProduct>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    size: { type: String },
    qty: { type: Number, required: true, min: 1 },
    color: { type: ColorSchema, required: false },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true },
  },
  { _id: false }
);

const PaymentResultSchema = new Schema<IPaymentResult>(
  {
    id: String,
    status: String,
    email: String,
  },
  { _id: false }
);

const DeliverySnapshotSchema = new Schema<IDeliverySnapshot>(
  {
    countryCode: { type: String, required: true },
    countryName: { type: String, required: true },
    fee: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    freeShippingApplied: { type: Boolean, required: true, default: false },
    freeShippingThreshold: { type: Number, default: null },
    estimatedDaysMin: { type: Number, required: true, min: 0 },
    estimatedDaysMax: { type: Number, required: true, min: 0 },
    ruleId: { type: String, required: true },
  },
  { _id: false }
);

/* -------------------- Main Schema -------------------- */

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: { type: [OrderProductSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, required: true },
    paymentResult: { type: PaymentResultSchema },

    total: { type: Number, required: true },
    totalBeforeDiscount: { type: Number },
    couponApplied: { type: String },
    shippingPrice: { type: Number, required: true, default: 0 },
    delivery: { type: DeliverySnapshotSchema, required: true },
    taxPrice: { type: Number, default: 0 },

    isPaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Not Processed", "Processing", "Dispatched", "Cancelled", "Completed"],
      default: "Not Processed",
    },

    paidAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

/* -------------------- Create Payload Type -------------------- */

export type IOrderCreate = {
  user: Types.ObjectId;
  products: IOrderProduct[];
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  paymentResult?: IPaymentResult;
  total: number;
  totalBeforeDiscount?: number;
  couponApplied?: string;
  shippingPrice: number;
  delivery: IDeliverySnapshot;
  taxPrice: number;
  isPaid: boolean;
  status: OrderStatus;
  paidAt?: Date;
  deliveredAt?: Date;
};

/* -------------------- Model -------------------- */

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;