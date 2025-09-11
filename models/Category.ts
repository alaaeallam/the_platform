import mongoose, { Schema, Document, Model } from "mongoose";

/* ---------- Interface ---------- */
export interface ICategory extends Document {
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/* ---------- Schema ---------- */
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [32, "Name must be at most 32 characters"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
  },
  { timestamps: true }
);

/* ---------- Model ---------- */
const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);

export default Category;