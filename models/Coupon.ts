// models/Coupon.ts
import mongoose, { Schema, Document, Model } from "mongoose";

/** Supports current admin CRUD + public latest-active API safely. */
export interface ICoupon extends Document {
  // identifiers
  coupon?: string; // primary current field
  code?: string;   // legacy / compatibility field

  // preferred active window fields
  startDate?: Date | null;
  endDate?: Date | null;

  // legacy compatibility fields
  startAt?: Date | null;
  endAt?: Date | null;

  // activation + limits
  isActive?: boolean;
  isFeatured?: boolean;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number | null;
  usedCount?: number | null;
  perUserLimit?: number;

  // discount value
  type?: "PERCENT" | "AMOUNT";
  value?: number;
  discount?: number;

  // misc
  description?: string;
  href?: string;
  appliesTo?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
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

    // preferred date fields used by admin CRUD + public homepage API
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    // legacy compatibility date fields
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    minOrder: { type: Number },
    maxDiscount: { type: Number },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number },

    type: { type: String, enum: ["PERCENT", "AMOUNT"], default: "PERCENT" },
    value: { type: Number },
    discount: { type: Number, min: 0, max: 100 },

    description: { type: String, trim: true },
    href: { type: String, trim: true },
    appliesTo: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);

export default Coupon;