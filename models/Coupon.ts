// models/Coupon.ts
import mongoose, { Schema, Document, Model } from "mongoose";

/* -------------------- TypeScript Interfaces -------------------- */

export interface ICoupon extends Document {
  coupon: string;
  startDate: string;   // consider Date type if you want proper date handling
  endDate: string;     // consider Date type if you want proper date handling
  discount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/* -------------------- Schema Definition -------------------- */

const couponSchema = new Schema<ICoupon>(
  {
    coupon: {
      type: String,
      trim: true,
      unique: true,
      uppercase: true,
      required: true,
      minlength: 4,
      maxlength: 10,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // optional safeguard
    },
  },
  {
    timestamps: true,
  }
);

/* -------------------- Model Export -------------------- */

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);

export default Coupon;