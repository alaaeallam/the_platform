import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const DeliveryRuleSchema = new Schema(
  {
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    countryName: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    freeShippingThreshold: {
      type: Number,
      default: null,
      min: 0,
    },
    estimatedDaysMin: {
      type: Number,
      default: 1,
      min: 0,
    },
    estimatedDaysMax: {
      type: Number,
      default: 3,
      min: 0,
      validate: {
        validator: function (this: { estimatedDaysMin?: number }, value: number) {
          return value >= (this.estimatedDaysMin ?? 0);
        },
        message: "estimatedDaysMax must be greater than or equal to estimatedDaysMin",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

DeliveryRuleSchema.index({ countryCode: 1 }, { unique: true });

export type DeliveryRuleDocument = InferSchemaType<typeof DeliveryRuleSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const DeliveryRule =
  models.DeliveryRule || model("DeliveryRule", DeliveryRuleSchema);

export default DeliveryRule;