import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";

const { ObjectId } = Schema.Types;

/* ---------- Small util ---------- */
const ucase = (v: unknown): string => (typeof v === "string" ? v.toUpperCase() : "");

/* ---------- Enums / constants ---------- */
export const MarketingTagEnum = [
  "FLASH_SALE",
  "NEW_ARRIVAL",
  "BLACK_FRIDAY",
  "BEST_SELLER",
  "LIMITED",
] as const;
type MarketingTag = (typeof MarketingTagEnum)[number];

/* ---------- Interfaces ---------- */
export interface IReview {
  reviewBy: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  size?: string;
  style?: { color?: string; image?: string };
  fit?: string;
  images: string[];
  likes: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICountryPrice {
  country: string; // ISO-3166 alpha-2: "EG", "US", ...
  price: number;
}

export interface ICountryGroupPrice {
  groupCode: string; // e.g. "LOW_ECONOMY", "MENA", "EU"
  price: number;
}

export interface IMarketingTag {
  tag: MarketingTag;
  startAt?: Date | null;
  endAt?: Date | null;
  badgeText?: string;
  priority?: number;
  isActive?: boolean;
}

export interface ISize {
  size: string; // "S", "M", "L"...
  qty: number;
  basePrice: number;
  countryPrices: ICountryPrice[];
  countryGroupPrices: ICountryGroupPrice[];
  discount?: number; // percent (0-100)
  marketingTags?: IMarketingTag[];
}

export interface ISubProduct {
  sku?: string;
  images: string[];
  description_images: string[];
  color?: { color?: string; image?: string };
  sizes: ISize[];
  discount: number; // percent (fallback for sizes)
  sold: number;
  marketingTags?: IMarketingTag[];
}

export interface IProduct extends Document {
  name: string;
  description: string;
  brand?: string;
  slug: string;
  category: mongoose.Types.ObjectId;
  subCategories: mongoose.Types.ObjectId[];
  details: { name: string; value: string }[];
  questions: { question: string; answer: string }[];
  reviews: IReview[];
  refundPolicy: string;
  rating: number;
  numReviews: number;
  shipping: number;
  subProducts: ISubProduct[];
  marketingTags?: IMarketingTag[];

  createdAt?: Date;
  updatedAt?: Date;

  getPriceFor(
    subIndex: number,
    sizeLabel: string,
    countryISO2: string,
    opts?: { countryGroups?: Record<string, string[]> }
  ): number | null;

  getDiscountedPrice(price: number, discountPercent?: number): number;

  getFinalPriceFor(
    subIndex: number,
    sizeLabel: string,
    countryISO2: string,
    opts?: { countryGroups?: Record<string, string[]> }
  ): {
    baseOrCountryPrice: number;
    discountPercent: number;
    discountedPrice: number;
    shipping: number;
    finalPrice: number;
  } | null;

  getFinalPriceList(
    subIndex: number,
    sizeLabel: string,
    countryISO2List: string[],
    opts?: { countryGroups?: Record<string, string[]> }
  ): Record<
    string,
    {
      baseOrCountryPrice: number;
      discountPercent: number;
      discountedPrice: number;
      shipping: number;
      finalPrice: number;
    }
  > | null;

  getActiveTags(
    context?: { at?: Date }
  ): {
    product: MarketingTag[];
    bySubIndex: Record<number, MarketingTag[]>;
    byVariantSize: Record<string, MarketingTag[]>;
  };
}

/* ---------- Sub-schemas ---------- */
const reviewSchema = new Schema<IReview>(
  {
    reviewBy: { type: ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, default: 0, min: 0, max: 5 },
    review: { type: String, required: true, trim: true },
    size: { type: String, trim: true },
    style: {
      color: { type: String, trim: true },
      image: { type: String, trim: true },
    },
    fit: { type: String, trim: true },
    images: [{ type: String }],
    likes: [{ type: ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const marketingTagSchema = new Schema<IMarketingTag>(
  {
    tag: { type: String, enum: MarketingTagEnum, required: true, index: true },
    startAt: { type: Date },
    endAt: { type: Date },
    badgeText: { type: String, trim: true },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean },
  },
  { _id: false }
);

const countryPriceSchema = new Schema<ICountryPrice>(
  {
    country: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 2,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const countryGroupPriceSchema = new Schema<ICountryGroupPrice>(
  {
    groupCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 32,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const sizeSchema = new Schema<ISize>(
  {
    size: { type: String, trim: true, required: true },
    qty: { type: Number, default: 0, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    countryPrices: { type: [countryPriceSchema], default: [] },
    countryGroupPrices: { type: [countryGroupPriceSchema], default: [] },
    discount: { type: Number, min: 0, max: 100 },
    marketingTags: { type: [marketingTagSchema], default: [] },
  },
  { _id: false }
);

const subProductSchema = new Schema<ISubProduct>(
  {
    sku: { type: String, trim: true },
    images: [{ type: String }],
    description_images: [{ type: String }],
    color: {
      color: { type: String, trim: true },
      image: { type: String, trim: true },
    },
    sizes: { type: [sizeSchema], default: [] },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    sold: { type: Number, default: 0, min: 0 },
    marketingTags: { type: [marketingTagSchema], default: [] },
  },
  { _id: false }
);

/* ---------- Product Schema ---------- */
const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: { type: ObjectId, ref: "Category", required: true },
    subCategories: [{ type: ObjectId, ref: "SubCategory" }],
    details: [
      { name: { type: String, trim: true }, value: { type: String, trim: true }, _id: false },
    ],
    questions: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
        _id: false,
      },
    ],
    reviews: { type: [reviewSchema], default: [] },
    refundPolicy: { type: String, default: "30 days", trim: true },
    rating: { type: Number, required: true, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, required: true, default: 0, min: 0 },
    shipping: { type: Number, required: true, default: 0, min: 0 },
    subProducts: { type: [subProductSchema], default: [] },
    marketingTags: { type: [marketingTagSchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ---------- Helpers ---------- */
function isTagActive(tag: IMarketingTag, now: Date): boolean {
  if (typeof tag.isActive === "boolean") return tag.isActive;
  if (tag.startAt && now < tag.startAt) return false;
  if (tag.endAt && now > tag.endAt) return false;
  return true;
}

/** Country group resolver (ultra-defensive) */
function resolveGroupPrice(
  size: ISize,
  countryISO2: string,
  countryGroups?: Record<string, string[]>
): number | undefined {
  if (!countryGroups) return undefined;

  const iso = ucase(countryISO2);
  const groupList = Array.isArray(size?.countryGroupPrices) ? size.countryGroupPrices : [];

  for (const [groupCodeRaw, countriesRaw] of Object.entries(countryGroups)) {
    const groupCode = ucase(groupCodeRaw); // safe
    // coerce to array, filter to strings, normalize
    const countries = (Array.isArray(countriesRaw) ? countriesRaw : [countriesRaw])
      .filter((c): c is string => typeof c === "string" && c.length > 0)
      .map(ucase);

    if (!countries.includes(iso)) continue;

    const found = groupList.find((g: any) => ucase(g?.groupCode) === groupCode);
    if (found && typeof (found as any).price === "number") return (found as any).price;
  }

  return undefined;
}

/* ---------- Methods ---------- */
/** Effective price for a given size and country (group > country > base). */
productSchema.methods.getPriceFor = function (
  subIndex: number,
  sizeLabel: string,
  countryISO2: string,
  opts?: { countryGroups?: Record<string, string[]> }
): number | null {
  const product = this as HydratedDocument<IProduct>;
  const sub = product.subProducts?.[subIndex];
  if (!sub) return null;

  const size = sub.sizes.find((s) => s.size === sizeLabel);
  if (!size) return null;

  // 1) group override
  const groupPrice = resolveGroupPrice(size, countryISO2, opts?.countryGroups);
  if (typeof groupPrice === "number") return groupPrice;

  // 2) per-country override
  const cps = Array.isArray(size.countryPrices) ? size.countryPrices : [];
  const iso = ucase(countryISO2);
  const match = cps.find((cp: any) => ucase(cp?.country) === iso);
  if (match && typeof match.price === "number") return match.price;

  // 3) base price
  return typeof size.basePrice === "number" ? size.basePrice : null;
};

/** Safe percent discount */
productSchema.methods.getDiscountedPrice = function (
  price: number,
  discountPercent?: number
): number {
  if (!price || !discountPercent || discountPercent <= 0) return price;
  return Math.max(0, price - (price * discountPercent) / 100);
};

/** Final price = (group/country/base) -> discount (size > subProduct) -> + shipping */
productSchema.methods.getFinalPriceFor = function (
  subIndex: number,
  sizeLabel: string,
  countryISO2: string,
  opts?: { countryGroups?: Record<string, string[]> }
) {
  const product = this as HydratedDocument<IProduct>;
  const sub = product.subProducts?.[subIndex];
  if (!sub) return null;

  const size = sub.sizes.find((s) => s.size === sizeLabel);
  if (!size) return null;

  const raw = product.getPriceFor(subIndex, sizeLabel, countryISO2, opts);
  if (raw == null) return null;

  const effectiveDiscount =
    typeof size.discount === "number" ? size.discount : sub.discount || 0;

  const discounted = product.getDiscountedPrice(raw, effectiveDiscount);
  const shipping = product.shipping || 0;

  return {
    baseOrCountryPrice: raw,
    discountPercent: effectiveDiscount,
    discountedPrice: discounted,
    shipping,
    finalPrice: discounted + shipping,
  };
};

/** Bulk final prices for many countries */
productSchema.methods.getFinalPriceList = function (
  subIndex: number,
  sizeLabel: string,
  countryISO2List: string[],
  opts?: { countryGroups?: Record<string, string[]> }
) {
  const product = this as HydratedDocument<IProduct>;
  const sub = product.subProducts?.[subIndex];
  if (!sub) return null;

  const size = sub.sizes.find((s) => s.size === sizeLabel);
  if (!size) return null;

  const effectiveDiscount =
    typeof size.discount === "number" ? size.discount : sub.discount || 0;

  const out: Record<
    string,
    {
      baseOrCountryPrice: number;
      discountPercent: number;
      discountedPrice: number;
      shipping: number;
      finalPrice: number;
    }
  > = {};

  for (const c of countryISO2List) {
    const raw = product.getPriceFor(subIndex, sizeLabel, c, opts);
    if (raw == null) continue;
    const discounted = product.getDiscountedPrice(raw, effectiveDiscount);
    const shipping = product.shipping || 0;
    out[ucase(c)] = {
      baseOrCountryPrice: raw,
      discountPercent: effectiveDiscount,
      discountedPrice: discounted,
      shipping,
      finalPrice: discounted + shipping,
    };
  }

  return Object.keys(out).length ? out : null;
};

/** Active tags at product/subProduct/size levels */
productSchema.methods.getActiveTags = function (context?: { at?: Date }) {
  const now = context?.at ?? new Date();
  const product = this as HydratedDocument<IProduct>;

  const productActive = (product.marketingTags || [])
    .filter((t) => isTagActive(t, now))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .map((t) => t.tag);

  const bySubIndex: Record<number, MarketingTag[]> = {};
  const byVariantSize: Record<string, MarketingTag[]> = {};

  product.subProducts?.forEach((sub, si) => {
    const subTags = (sub.marketingTags || [])
      .filter((t) => isTagActive(t, now))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .map((t) => t.tag);
    bySubIndex[si] = subTags;

    sub.sizes.forEach((sz) => {
      const key = `${si}:${sz.size}`;
      const sTags = (sz.marketingTags || [])
        .filter((t) => isTagActive(t, now))
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        .map((t) => t.tag);
      byVariantSize[key] = sTags;
    });
  });

  return { product: productActive, bySubIndex, byVariantSize };
};

/* ---------- Model ---------- */
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;