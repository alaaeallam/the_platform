// models/Cart.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

const { ObjectId } = Schema.Types;

/* ---------- Interfaces ---------- */
export interface ICartProduct {
  product: Types.ObjectId;
  name: string;
  image: string;
  style: number;           // ⬅️ add this
  size: string;
  qty: number;
  color?: {
    color?: string;
    image?: string;
  };
  price: number;
}


export interface ICart extends Document {
  products: ICartProduct[];
  cartTotal: number;
  totalAfterDiscount?: number;
  user: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

/* ---------- Schema ---------- */
const cartProductSchema = new Schema<ICartProduct>(
  {
    product: { type: ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    style: { type: Number, required: true },     // ⬅️ add this
    size: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    color: {
      color: { type: String },
      image: { type: String },
    },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    products: { type: [cartProductSchema], default: [] },
    cartTotal: { type: Number, required: true },
    totalAfterDiscount: { type: Number },
    user: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

/* ---------- Model ---------- */
const CartModel: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", cartSchema);

export default CartModel;