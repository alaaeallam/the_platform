import { connectDb } from "@/utils/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import HomePageClient from "./HomePageClient";
import type { FlashDealProduct } from "@/components/home/flashDeals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HomeCategoryVM = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
};

type LeanMarketingTag = {
  tag?: string;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  isActive?: boolean;
  priority?: number;
};

type LeanSize = {
  basePrice?: number;
  discount?: number;
  qty?: number;
};

type LeanSubProduct = {
  images?: string[];
  discount?: number;
  sold?: number;
  sizes?: LeanSize[];
};

type LeanProduct = {
  _id: unknown;
  slug?: string;
  marketingTags?: LeanMarketingTag[];
  subProducts?: LeanSubProduct[];
};

function isTagActive(tag: LeanMarketingTag, now: Date): boolean {
  if (typeof tag.isActive === "boolean") return tag.isActive;

  const startAt = tag.startAt ? new Date(tag.startAt) : null;
  const endAt = tag.endAt ? new Date(tag.endAt) : null;

  if (startAt && now < startAt) return false;
  if (endAt && now > endAt) return false;

  return true;
}

function getFirstFlashSaleTag(
  tags: LeanMarketingTag[] | undefined,
  now: Date
): LeanMarketingTag | null {
  if (!Array.isArray(tags)) return null;

  const active = tags
    .filter((tag) => tag?.tag === "FLASH_SALE" && isTagActive(tag, now))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return active[0] ?? null;
}

function toFlashDealProduct(product: LeanProduct): FlashDealProduct | null {
  const firstSub = product.subProducts?.[0];
  const firstSize = firstSub?.sizes?.[0];
  const image = firstSub?.images?.[0] ?? "";
  const slug = product.slug ?? "";

  if (!image || !slug) return null;

  const price =
    typeof firstSize?.basePrice === "number" ? firstSize.basePrice : 0;

  const discount =
    typeof firstSize?.discount === "number"
      ? firstSize.discount
      : typeof firstSub?.discount === "number"
      ? firstSub.discount
      : 0;

  const soldUnits = typeof firstSub?.sold === "number" ? firstSub.sold : 0;

  const remainingQty = Array.isArray(firstSub?.sizes)
    ? firstSub.sizes.reduce(
        (sum, size) => sum + (typeof size?.qty === "number" ? size.qty : 0),
        0
      )
    : 0;

  const totalUnits = soldUnits + remainingQty;

  const sold =
    totalUnits > 0
      ? Math.max(0, Math.min(100, Math.round((soldUnits / totalUnits) * 100)))
      : 0;

  return {
    id: String(product._id),
    link: `/products/${slug}`,
    image,
    price,
    discount,
    sold,
  };
}

async function getHomeCategories(): Promise<HomeCategoryVM[]> {
  await connectDb();

  const categories = await Category.find({})
    .sort({ updatedAt: -1 })
    .limit(6)
    .lean<Array<{ _id: unknown; name?: string; slug?: string; image?: string }>>();

  return categories.map((category) => ({
    _id: String(category._id),
    name: category.name ?? "Category",
    slug: category.slug ?? "",
    image: category.image ?? "",
  }));
}

async function getMenuCategories(): Promise<HomeCategoryVM[]> {
  await connectDb();

  const categories = await Category.find({})
    .sort({ updatedAt: -1 })
    .lean<Array<{ _id: unknown; name?: string; slug?: string; image?: string }>>();

  return categories.map((category) => ({
    _id: String(category._id),
    name: category.name ?? "Category",
    slug: category.slug ?? "",
    image: category.image ?? "",
  }));
}

async function getFlashSaleProducts(): Promise<{
  products: FlashDealProduct[];
  endsAt: string | null;
}> {
  await connectDb();

  const now = new Date();

  const raw = await Product.find({
    marketingTags: {
      $elemMatch: {
        tag: "FLASH_SALE",
      },
    },
  })
    .select("slug marketingTags subProducts")
    .sort({ updatedAt: -1 })
    .limit(12)
    .lean<LeanProduct[]>();

  const eligible = raw.filter((product) =>
    !!getFirstFlashSaleTag(product.marketingTags, now)
  );

  const products = eligible
    .map(toFlashDealProduct)
    .filter((p): p is FlashDealProduct => p !== null);

  const endDates = eligible
    .map((product) => getFirstFlashSaleTag(product.marketingTags, now)?.endAt)
    .filter(Boolean)
    .map((value) => new Date(value as Date | string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    products,
    endsAt: endDates[0] ? endDates[0].toISOString() : null,
  };
}

export default async function Page() {
  const [initialCategories, menuCategories, flashSale] = await Promise.all([
    getHomeCategories(),
    getMenuCategories(),
    getFlashSaleProducts(),
  ]);

  return (
    <HomePageClient
      initialCategories={initialCategories}
      menuCategories={menuCategories}
      flashSaleProducts={flashSale.products}
      flashSaleEndsAt={flashSale.endsAt}
    />
  );
}