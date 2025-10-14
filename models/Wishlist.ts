// models/Wishlist.ts
import mongoose, { Schema, Model } from "mongoose";
import type { WishItem } from "@/types/wishlist";

export interface IWishlist {
  user: mongoose.Types.ObjectId;
  items: WishItem[];
}

const WishItemSchema = new Schema<WishItem>(
  {
    key: { type: String, required: true },
    productId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    priceSnapshot: Number,
    subProductId: String,
    size: String,
    color: String,
    addedAt: { type: String, required: true },
  },
  { _id: false }
);

const WishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", unique: true, index: true },
    items: { type: [WishItemSchema], default: [] },
  },
  { timestamps: true }
);

export default (mongoose.models.Wishlist as Model<IWishlist>) ||
  mongoose.model<IWishlist>("Wishlist", WishlistSchema);