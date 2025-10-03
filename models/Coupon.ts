// models/Coupon.ts
import mongoose, { Schema, Document, Model } from "mongoose";

/** Supports BOTH legacy and new field names so TS stays happy. */
export interface ICoupon extends Document {
  // identifiers
  coupon?: string; // legacy
  code?: string;   // new

  // date window (new shape uses Date)
  startAt?: Date;
  endAt?: Date;

  // legacy date fields kept for compatibility (strings)
  startDate?: string;
  endDate?: string;

  // activation + limits
  isActive?: boolean;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;

  // discount value
  type?: "PERCENT" | "AMOUNT"; // new
  value?: number;              // new
  discount?: number;           // legacy percent

  // misc
  description?: string;
  appliesTo?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    // identifiers (allow either). Keep both sparse so only one needs to exist.
    coupon: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      minlength: 2,
      maxlength: 32,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      minlength: 2,
      maxlength: 32,
    },

    // new date fields (preferred)
    startAt: { type: Date },
    endAt: { type: Date },

    // legacy string date fields (kept for compatibility)
    startDate: { type: String },
    endDate: { type: String },

    // activation + limits
    isActive: { type: Boolean, default: true },
    minOrder: { type: Number },
    maxDiscount: { type: Number },
    usageLimit: { type: Number },
    perUserLimit: { type: Number },

    // discount value
    type: { type: String, enum: ["PERCENT", "AMOUNT"], default: "PERCENT" },
    value: { type: Number },     // amount or percent depending on `type`
    discount: { type: Number },  // legacy percent-only

    // misc
    description: { type: String },
    appliesTo: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);

export default Coupon;