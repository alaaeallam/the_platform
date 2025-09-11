// lib/pricing.ts
export type CountryISO2 = string;

export type CountryPrice = { country: CountryISO2; price: number };
export type CountryGroupPrice = { groupCode: string; price: number };

// map of ISO2 -> group codes (you can expand later)
export type CountryGroupsMap = Record<CountryISO2, string[]>;

export interface SizeSchema {
  size: string;
  qty: number;
  basePrice: number;
  // optional per-size overrides (from our schema)
  discount?: number; // %
  countryPrices?: CountryPrice[];
  countryGroupPrices?: CountryGroupPrice[];
}

export interface SubProductSchema {
  sku?: string;
  images: string[];
  discount?: number; // %
  sizes: SizeSchema[];
  color?: { image?: string; color?: string };
}

export interface ProductSchema {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shipping?: number;
  rating: number;
  numReviews: number;
  subProducts: SubProductSchema[];
}

function lookupCountryOverride(
  size: SizeSchema,
  iso2: CountryISO2,
  groups: CountryGroupsMap | undefined
): number | undefined {
  // 1) direct country override
  const direct = size.countryPrices?.find((c) => c.country.toUpperCase() === iso2.toUpperCase())?.price;
  if (typeof direct === "number") return direct;

  // 2) group override
  if (!groups) return undefined;
  const isoGroups = groups[iso2.toUpperCase()] ?? [];
  const byGroup = size.countryGroupPrices?.find((g) => isoGroups.includes(g.groupCode))?.price;
  return byGroup;
}

export function computeEffectivePrice(
  size: SizeSchema,
  sub: SubProductSchema,
  countryISO2: CountryISO2,
  groups?: CountryGroupsMap
) {
  const base = lookupCountryOverride(size, countryISO2, groups) ?? size.basePrice;

  // discount precedence: size-level overrides subProduct-level
  const pct = typeof size.discount === "number" ? size.discount : (sub.discount ?? 0);
  const price = pct > 0 ? +(base - (base * pct) / 100).toFixed(2) : base;

  return {
    basePrice: base,
    discountPct: pct,
    price,
  };
}

export function computeRangeForSub(
  sub: SubProductSchema,
  countryISO2: CountryISO2,
  groups?: CountryGroupsMap
) {
  if (!sub.sizes?.length) return { label: "No prices", min: 0, max: 0 };

  const vals = sub.sizes.map((s) => computeEffectivePrice(s, sub, countryISO2, groups).price);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const label = min === max ? `${min}$` : `From ${min}$ to ${max}$`;
  return { label, min, max };
}