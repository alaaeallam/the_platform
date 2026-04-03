import { connectDb } from "@/utils/db";
import DeliveryRule from "@/models/DeliveryRule";

type DeliveryRuleLean = {
  _id: unknown;
  countryCode: string;
  countryName: string;
  fee: number;
  currency: string;
  freeShippingThreshold?: number | null;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  isActive: boolean;
};

export type DeliveryCalculationInput = {
  countryCode: string;
  subtotal: number;
};

export type DeliveryCalculationResult = {
  countryCode: string;
  countryName: string;
  fee: number;
  currency: string;
  freeShippingApplied: boolean;
  freeShippingThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  ruleId: string;
};

export async function calculateDelivery({
  countryCode,
  subtotal,
}: DeliveryCalculationInput): Promise<DeliveryCalculationResult> {
  const normalizedCountryCode = String(countryCode || "").trim().toUpperCase();
  const normalizedSubtotal = Number(subtotal);

  if (!normalizedCountryCode) {
    throw new Error("countryCode is required for delivery calculation");
  }

  if (!Number.isFinite(normalizedSubtotal) || normalizedSubtotal < 0) {
    throw new Error("subtotal must be a valid number greater than or equal to 0");
  }

  await connectDb();

  const rule = (await DeliveryRule.findOne({
    countryCode: normalizedCountryCode,
    isActive: true,
  }).lean()) as DeliveryRuleLean | null;

  if (!rule) {
    throw new Error(`Delivery is not available for country ${normalizedCountryCode}`);
  }

  const threshold =
    typeof rule.freeShippingThreshold === "number"
      ? rule.freeShippingThreshold
      : null;

  const freeShippingApplied =
    threshold !== null && normalizedSubtotal >= threshold;

  const finalFee = freeShippingApplied ? 0 : Number(rule.fee);

  return {
    countryCode: String(rule.countryCode),
    countryName: String(rule.countryName),
    fee: finalFee,
    currency: String(rule.currency),
    freeShippingApplied,
    freeShippingThreshold: threshold,
    estimatedDaysMin: Number(rule.estimatedDaysMin ?? 0),
    estimatedDaysMax: Number(rule.estimatedDaysMax ?? 0),
    ruleId: String(rule._id),
  };
}