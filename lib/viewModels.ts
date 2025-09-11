// lib/viewModels.ts
import type { CountryGroupsMap } from "./pricing";
import type { IProduct } from "@/models/Product";
import type { ProductInfosVM } from "@/components/productPage/infos";

/* ---------- Local structural helpers (optional fields) ---------- */
type SizeVMSource = {
  size: string;
  qty: number;
  basePrice?: number;
  price?: number; // legacy/seed data
  discount?: number;
  pricesByCountry?: Record<string, number>;
};

type SubProductVMSource = {
  sku?: string;
  images: string[];
  discount?: number;
  color?: { color?: string; image?: string };
  sizes: SizeVMSource[];
  pricesByCountry?: Record<string, number>;
};

export interface BuildVMOptions {
  styleIndex: number;
  sizeIndex: number;
  countryISO2: string;
  countryGroups?: CountryGroupsMap; // reserved for future logic
}

/* ---------- Small utilities (no 'any') ---------- */
const asPartialSize = (s: unknown): Partial<SizeVMSource> =>
  (s ?? {}) as Partial<SizeVMSource>;

const asPartialSub = (sp: unknown): Partial<SubProductVMSource> =>
  (sp ?? {}) as Partial<SubProductVMSource>;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/* ---------- Core ---------- */
export function buildProductViewModel(
  product: IProduct,
  opts: BuildVMOptions
): ProductInfosVM {
  const { styleIndex, sizeIndex, countryISO2 } = opts;

  // Guard style
  const subAny = (product.subProducts ?? [])[styleIndex];
  if (!subAny) {
    return {
      _id: String((product as unknown as { _id?: unknown })._id ?? ""),
      name: product.name,
      slug: product.slug,
      rating: product.rating ?? 0,
      numReviews: product.numReviews ?? 0,
      createdAt:
        (product as unknown as { createdAt?: Date })?.createdAt?.toISOString?.() ??
        new Date().toISOString(),
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

  const sub = asPartialSub(subAny);
  const sizesAny = (sub.sizes ?? []) as unknown[];
  const size = sizesAny[sizeIndex];

  const sizeP = asPartialSize(size);

  // Country overrides → basePrice → legacy price
  const sizeCountry = sizeP.pricesByCountry?.[countryISO2];
  const subCountry = sub.pricesByCountry?.[countryISO2];

  const baseBeforeDiscount =
    (isNum(sizeCountry) ? sizeCountry
      : isNum(subCountry) ? subCountry
      : undefined) ??
    (isNum(sizeP.basePrice) ? sizeP.basePrice : undefined) ??
    (isNum(sizeP.price) ? sizeP.price : 0);

  // Discount precedence: size-level overrides sub-level
  const discount = isNum(sizeP.discount) ? sizeP.discount : (sub.discount ?? 0);

  // Final price for chosen size
  const price =
    discount > 0
      ? Number((baseBeforeDiscount - (baseBeforeDiscount * discount) / 100).toFixed(2))
      : baseBeforeDiscount;

  // Price range text across sizes (use base price BEFORE discount)
  const baseList = sizesAny
    .map((s) => {
      const sp = asPartialSize(s);
      const sCountry = sp.pricesByCountry?.[countryISO2];
      const sBase =
        (isNum(sCountry) ? sCountry : undefined) ??
        (isNum(sp.basePrice) ? sp.basePrice : undefined) ??
        (isNum(sp.price) ? sp.price : 0);
      return sBase;
    })
    .filter(isNum)
    .sort((a, b) => a - b);

  const priceRange =
    discount > 0 && baseList.length
      ? `From ${(baseList[0] - (baseList[0] * discount) / 100).toFixed(2)} to ${(baseList[baseList.length - 1] - (baseList[baseList.length - 1] * discount) / 100).toFixed(2)}$`
      : baseList.length
      ? `From ${baseList[0]} to ${baseList[baseList.length - 1]}$`
      : "No prices";

  // Build VM
  return {
    _id: String((product as unknown as { _id?: unknown })._id ?? ""),
    name: product.name,
    slug: product.slug,
    rating: product.rating ?? 0,
    numReviews: product.numReviews ?? 0,
    createdAt:
      (product as unknown as { createdAt?: Date })?.createdAt?.toISOString?.() ??
      new Date().toISOString(),
    description: product.description ?? "",
    details: product.details ?? [],
    style: styleIndex,
    images: sub.images ?? [],
    sizes: sizesAny.map((s) => {
      const sp = asPartialSize(s);
      return { size: String(sp.size ?? ""), qty: Number(sp.qty ?? 0) };
    }),
    discount,
    sku: sub.sku ?? "",
    colors: (product.subProducts ?? []).map((p) => (p as Partial<SubProductVMSource>).color ?? {}),
    priceRange,
    price,                 // after discount
    priceBefore: baseBeforeDiscount,
    quantity: Number(sizeP.qty ?? 0),
    shipping: product.shipping ?? 0,
    subProducts: (product.subProducts ?? []).map((sp) => ({
      images: (asPartialSub(sp).images ?? []) as string[],
    })),
  };
}