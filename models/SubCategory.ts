import mongoose, { Schema, Document, Model } from "mongoose";

const { ObjectId } = Schema.Types;

/* ---------- Interface ---------- */
export interface ISubCategory extends Document {
  name: string;
  slug: string;
  parent: mongoose.Types.ObjectId; // reference to Category
  createdAt?: Date;
  updatedAt?: Date;
}

/* ---------- Schema ---------- */
const subCategorySchema = new Schema<ISubCategory>(
  {
    name: {
      type: String,
      required: [true, "SubCategory name is required"],
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
    parent: {
      type: ObjectId,
      ref: "Category",
      required: [true, "Parent category is required"],
    },
  },
  { timestamps: true }
);

/* ---------- Model ---------- */
const SubCategory: Model<ISubCategory> =
  mongoose.models.SubCategory ||
  mongoose.model<ISubCategory>("SubCategory", subCategorySchema);

export default SubCategory;