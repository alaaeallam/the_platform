// models/User.ts
import mongoose, { Schema, type InferSchemaType, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true, index: true },
    password: String, // hashed
    image: String,
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    emailVerified: Date,
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export default models.User || model("User", UserSchema);