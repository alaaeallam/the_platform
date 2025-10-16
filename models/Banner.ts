// models/Banner.ts
import "server-only";
import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const BannerSchema = new Schema(
  {
    placement: { type: String, required: true, index: true }, // e.g. "home-hero"
    title: String,
    subtitle: String,
    image: { type: String, required: true },
    mobileImage: String,
    ctaLabel: String,
    ctaHref: String,
    theme: {
      bg: String,
      fg: String,
      align: { type: String, default: "center" }, // "left" | "center" | "right"
    },
    active: { type: Boolean, default: true, index: true },
    startsAt: Date,
    endsAt: Date,
    priority: { type: Number, default: 0, index: true },
    locale: String,
    variant: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export type BannerDoc = InferSchemaType<typeof BannerSchema>;

// hard fail if accidentally imported in the browser
if (typeof window !== "undefined") {
  throw new Error("models/Banner must not be imported on the client.");
}

export default (mongoose.models?.Banner as Model<BannerDoc>) ??
  mongoose.model<BannerDoc>("Banner", BannerSchema);