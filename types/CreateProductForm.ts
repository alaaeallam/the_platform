// types/CreateProductForm.ts
export type CountryPriceRow = { country: string; price: number };
export type CountryGroupPriceRow = { groupCode: string; price: number };

export type SizeInput = {
  size: string;
  qty: number;
  basePrice: number;
  discount?: number;
  countryPrices: CountryPriceRow[];
  countryGroupPrices: CountryGroupPriceRow[];
};

export type SubProductInput = {
  sku?: string;
  images: string[];
  description_images: string[];
  color?: { color?: string; image?: string };
  sizes: SizeInput[];
  discount: number;
  marketingTags?: Array<{
    tag: "FLASH_SALE" | "NEW_ARRIVAL" | "BLACK_FRIDAY" | "BEST_SELLER" | "LIMITED";
    startAt?: string | null;
    endAt?: string | null;
    badgeText?: string;
    priority?: number;
    isActive?: boolean;
  }>;
};

export type ProductInput = {
  name: string;
  description: string;
  brand?: string;
  slug: string;
  category: string;               // ObjectId (as string)
  subCategories: string[];        // ObjectId[]
  details: Array<{ name: string; value: string }>;
  questions: Array<{ question: string; answer: string }>;
  refundPolicy?: string;
  shipping: number;
  subProducts: SubProductInput[];
  marketingTags?: SubProductInput["marketingTags"];
};