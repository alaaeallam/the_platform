// lib/viewModels.ts
import type { CountryGroupsMap } from "./pricing";
import type { IProduct } from "@/models/Product";
import type { ProductInfosVM } from "@/components/productPage/infos";

/** Per-country override on a size */
interface CountryPrice {
  countryISO2: string; // e.g. "US", "EG"
  price: number;
}

/** Per-group override on a size (e.g. "LOW_ECONOMY") */
interface CountryGroupPrice {
  group: string;
  price: number;
}

/** The bits we actually need from product.subProducts[*].sizes[*] */
interface SizeSource {
  size: string;
  qty: number;
  basePrice?: number; // main price field in your data
  price?: number;     // legacy fallback
  discount?: number;  // optional size-level discount
  countryPrices?: CountryPrice[];
  countryGroupPrices?: CountryGroupPrice[];
}

/** The bits we actually need from product.subProducts[*] */
interface SubProductSource {
  sku?: string | null;
  images: string[];
  discount?: number; // sub-product level discount
  color?: { color?: string; image?: string };
  sizes: SizeSource[];
}

/** Options for building the VM */
export interface BuildVMOptions {
  styleIndex: number;
  sizeIndex: number;
  countryISO2: string;
  countryGroups?: CountryGroupsMap;
}

/* ----------------------- small utilities ----------------------- */

function toIdString(id: unknown): string {
  if (typeof id === "string") return id;
  if (id && typeof (id as { toString: () => string }).toString === "function") {
    return (id as { toString: () => string }).toString();
  }
  return "";
}

function toISODateString(dt: unknown): string {
  if (typeof dt === "string") return dt;
  if (dt instanceof Date) return dt.toISOString();
  return new Date().toISOString();
}

function groupsForCountry(countryISO2: string, map?: CountryGroupsMap): readonly string[] {
  if (!map) return [];
  return map[countryISO2 as keyof CountryGroupsMap] ?? [];
}

/** Pick the best per-country override for a size (country > group > none) */
function pickCountryOverride(
  countryISO2: string,
  groups: readonly string[],
  size: SizeSource
): number | undefined {
  const direct = size.countryPrices?.find((c) => c.countryISO2 === countryISO2)?.price;
  if (typeof direct === "number") return direct;

  const groupHit = size.countryGroupPrices?.find((g) => groups.includes(g.group))?.price;
  return typeof groupHit === "number" ? groupHit : undefined;
}

/* ----------------------- core builder ----------------------- */

export function buildProductViewModel(
  product: IProduct,
  opts: BuildVMOptions
): ProductInfosVM {
  const { styleIndex, sizeIndex, countryISO2, countryGroups } = opts;

  const sub = (product.subProducts?.[styleIndex] ?? {}) as unknown as SubProductSource | undefined;
  if (!sub) {
    // Graceful empty VM if the style index is invalid
    return {
      _id: toIdString((product as unknown as { _id?: unknown })._id),
      name: product.name,
      slug: product.slug,
      rating: product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      createdAt: toISODateString((product as unknown as { createdAt?: unknown }).createdAt),
      description: product.description ?? "",
      details: product.details ?? [],
      style: styleIndex,
      images: [],
      sizes: [],
      discount: 0,
      sku: "",
      colors: [],
      priceRange: "No prices",
      price: 0,
      priceBefore: 0,
      quantity: 0,
      shipping: product.shipping ?? 0,
      subProducts: [],
    };
  }

  const sizes = sub.sizes ?? [];
  const size = sizes[sizeIndex];

  // 1) Base price for chosen size: country override > basePrice > legacy price
  const groupList = groupsForCountry(countryISO2, countryGroups);
  const override = size ? pickCountryOverride(countryISO2, groupList, size) : undefined;
  const baseBeforeDiscount = (typeof override === "number" ? override : undefined)
    ?? size?.basePrice ?? size?.price ?? 0;

  // 2) Effective discount: size-level overrides sub-level
  const discount = (typeof size?.discount === "number" ? size.discount : sub.discount) ?? 0;

  // 3) Final price for the chosen size
  const price =
    discount > 0
      ? Number((baseBeforeDiscount - (baseBeforeDiscount * discount) / 100).toFixed(2))
      : baseBeforeDiscount;

  // 4) Price range text across sizes (use base price BEFORE discount; consider overrides per size)
  const baseList = sizes
    .map((s) => {
      const ov = pickCountryOverride(countryISO2, groupList, s);
      const b = (typeof ov === "number" ? ov : undefined) ?? s.basePrice ?? s.price ?? 0;
      return b;
    })
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const priceRange =
    discount > 0 && baseList.length
      ? `From ${(baseList[0] - (baseList[0] * discount) / 100).toFixed(2)} to ${(baseList[baseList.length - 1] - (baseList[baseList.length - 1] * discount) / 100).toFixed(2)}$`
      : baseList.length
      ? `From ${baseList[0]} to ${baseList[baseList.length - 1]}$`
      : "No prices";

  // 5) Build the VM (note: include createdAt to satisfy ProductInfosVM)
  return {
    _id: toIdString((product as unknown as { _id?: unknown })._id),
    name: product.name,
    slug: product.slug,
    rating: product.rating ?? 0,
    numReviews: product.numReviews ?? 0,
    createdAt: toISODateString((product as unknown as { createdAt?: unknown }).createdAt),
    description: product.description ?? "",
    details: product.details ?? [],
    style: styleIndex,
    images: sub.images ?? [],
    sizes: sizes.map((s) => ({ size: s.size, qty: s.qty })), // VM needs label + qty only
    discount,
    sku: sub.sku ?? "",
    colors: (product.subProducts ?? []).map((p: unknown) => (p as SubProductSource).color ?? {}),
    priceRange,
    price,
    priceBefore: baseBeforeDiscount,
    quantity: size?.qty ?? 0,
    shipping: product.shipping ?? 0,
    subProducts: (product.subProducts ?? []).map((sp: unknown) => ({
      images: (sp as SubProductSource).images ?? [],
    })),
  };
}