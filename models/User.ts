// models/User.ts
import mongoose, { Schema, Types, Document, Model } from "mongoose";

/* ----------------------------- Subdoc Types ----------------------------- */

export interface Address {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  active: boolean;
}

export interface WishlistItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  style?: string;
}

/* --------------------------------- User --------------------------------- */

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: string; // e.g. "user" | "admin"
  image: string;
  emailVerified: boolean;
  defaultPaymentMethod: string;
  address: Address[];
  wishlist: WishlistItem[];
}

export interface IUserDocument extends IUser, Document {}
export type IUserModel = Model<IUserDocument>;

/* ------------------------------- Schemas -------------------------------- */

const AddressSchema = new Schema<Address>(
  {
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    address1: { type: String, required: false },
    address2: { type: String, required: false },
    city: { type: String, required: false },
    zipCode: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String, required: false },
    active: { type: Boolean, default: false },
  },
  { _id: true }
);

const WishlistItemSchema = new Schema<WishlistItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    style: { type: String, required: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Please enter your full name."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email address."],
      trim: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please enter a password."],
    },
    role: {
      type: String,
      default: "user",
    },
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/dmhcnhtng/image/upload/v1664642478/992490_b0iqzq.png",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    defaultPaymentMethod: {
      type: String,
      default: "",
    },
    address: {
      type: [AddressSchema],
      default: [],
    },
    wishlist: {
      type: [WishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

/* ------------------------------ Model Export ---------------------------- */

const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUserDocument, IUserModel>("User", UserSchema);

export default User;