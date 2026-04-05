// app/browse/page.tsx
import styles from "@/app/styles/browse.module.scss";
const cls = styles as Record<string, string>;
import BrowseClient from "@/components/browse/BrowseClient";

import { connectDb } from "@/utils/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import { filterArray, randomize, removeDuplicates } from "@/utils/arrays_utils";
import { Types } from "mongoose";

import type { Metadata } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse",
};

// ---------------------------- Types ----------------------------
export type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  // Next 15: searchParams is fine to type as a Promise for compatibility with streaming.
  searchParams: Promise<SearchParams>;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCategoryValue(value: string) {
  return decodeURIComponent(value).trim().toLowerCase();
}

type SortSpec = Record<string, 1 | -1>;

type BrowseCategoryDoc = {
  _id: unknown;
  name?: string;
  slug?: string;
  image?: string;
};

type BrowseSubCategoryParentDoc = {
  _id: unknown;
  name?: string;
  slug?: string;
};

type BrowseSubCategoryDoc = {
  _id: unknown;
  name?: string;
  slug?: string;
  parent?: BrowseSubCategoryParentDoc | null;
};

export default async function BrowsePage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // ------------------------- Query parsing -------------------------
  const getStr = (k: string) => (typeof sp[k] === "string" ? String(sp[k]) : "");
  const getArr = (k: string) =>
    Array.isArray(sp[k])
      ? (sp[k] as string[])
      : typeof sp[k] === "string"
      ? String(sp[k]).split("_")
      : [];

  const searchQuery = getStr("search");
  const categoryQueryRaw = getStr("category");
  const genderQuery = getStr("gender");
  const priceQuery = getStr("price");
  const shippingQuery = getStr("shipping");
  const ratingQuery = getStr("rating");
  const sortQuery = getStr("sort");
  const pageSize = 50;
  const page = Number(getStr("page") || 1);

  const brandQuery = getArr("brand");
  const styleQuery = getArr("style");
  const patternQuery = getArr("pattern");
  const materialQuery = getArr("material");
  const sizeQuery = getArr("size");
  const colorQuery = getArr("color");

  const createRegex = (data: string[], first: string) => {
    if (!data.length) return "";
    let rx = `^${first}`;
    for (let i = 1; i < data.length; i++) rx += `|^${data[i]}`;
    return rx;
  };

  const brandRegex = createRegex(brandQuery, brandQuery[0] || "");
  const styleRegex = createRegex(styleQuery, styleQuery[0] || "");
  const patternRegex = createRegex(patternQuery, patternQuery[0] || "");
  const materialRegex = createRegex(materialQuery, materialQuery[0] || "");
  const sizeRegex = createRegex(sizeQuery, sizeQuery[0] || "");
  const colorRegex = createRegex(colorQuery, colorQuery[0] || "");

let resolvedCategoryId = "";
let resolvedCategoryName = "";
const normalizedCategoryQuery = categoryQueryRaw
  ? normalizeCategoryValue(categoryQueryRaw)
  : "";

const sortSpec = ((): SortSpec => {
  switch (sortQuery) {
    case "popular":
      return { rating: -1, "subProducts.sold": -1 };
    case "newest":
      return { createdAt: -1 };
    case "topSelling":
      return { "subProducts.sold": -1 };
    case "topReviewed":
      return { rating: -1 };
    case "priceHighToLow":
      return { "subProducts.sizes.price": -1 };
    case "priceLowToHigh":
      return { "subProducts.sizes.price": 1 };
    default:
      return {};
  }
})();

  // ------------------------- Mongo filters -------------------------
  const search = searchQuery
    ? { name: { $regex: searchQuery, $options: "i" } }
    : {};
  const style = styleQuery.length
    ? { "details.value": { $regex: styleRegex, $options: "i" } }
    : {};
  const size = sizeQuery.length
    ? { "subProducts.sizes.size": { $regex: sizeRegex, $options: "i" } }
    : {};
  const color = colorQuery.length
    ? { "subProducts.color.color": { $regex: colorRegex, $options: "i" } }
    : {};
  const brand = brandQuery.length
    ? { brand: { $regex: brandRegex, $options: "i" } }
    : {};
  const pattern = patternQuery.length
    ? { "details.value": { $regex: patternRegex, $options: "i" } }
    : {};
  const material = materialQuery.length
    ? { "details.value": { $regex: materialRegex, $options: "i" } }
    : {};
  const gender = genderQuery
    ? { "details.value": { $regex: genderQuery, $options: "i" } }
    : {};
  const price = priceQuery
    ? {
        "subProducts.sizes.price": {
          $gte: Number(priceQuery.split("_")[0]) || 0,
          $lte: Number(priceQuery.split("_")[1]) || Infinity,
        },
      }
    : {};
  const shipping = shippingQuery === "0" ? { shipping: 0 } : {};
  const rating = ratingQuery ? { rating: { $gte: Number(ratingQuery) } } : {};

  // --------------------------- Fetch data ---------------------------
  await connectDb();

  if (categoryQueryRaw) {
    const categoryOrConditions: Record<string, unknown>[] = [];

    if (Types.ObjectId.isValid(categoryQueryRaw)) {
      categoryOrConditions.push({ _id: categoryQueryRaw });
    }

    if (normalizedCategoryQuery) {
      categoryOrConditions.push({ slug: normalizedCategoryQuery });
      categoryOrConditions.push({
        name: {
          $regex: `^${escapeRegex(normalizedCategoryQuery.replace(/-/g, " "))}$`,
          $options: "i",
        },
      });
    }

    if (categoryOrConditions.length) {
      const matchedCategory = await Category.findOne({
        $or: categoryOrConditions,
      })
        .select("_id name slug")
        .lean();

      if (matchedCategory?._id) {
        resolvedCategoryId = String(matchedCategory._id);
        resolvedCategoryName = String(matchedCategory.name || "");
      }
    }
  }

  const category = resolvedCategoryId ? { category: resolvedCategoryId } : {};

  const invalidCategoryFilter =
    categoryQueryRaw && !resolvedCategoryId ? { _id: { $in: [] } } : {};
  let query = Product.find({
    ...search,
    ...category,
    ...brand,
    ...style,
    ...size,
    ...color,
    ...pattern,
    ...material,
    ...gender,
    ...price,
    ...shipping,
    ...rating,
    ...invalidCategoryFilter,
  })
    .select([
      "_id",
      "slug",
      "name",
      "subProducts.images",
      "subProducts.discount",
      "subProducts.color.image",
      "subProducts.color.color",
      "subProducts.sizes.price",
      "subProducts.sizes.basePrice",
      "subProducts.sizes.discount",
      "subProducts.sizes.countryPrices.country",
      "subProducts.sizes.countryPrices.price",
      "subProducts.sizes.countryGroupPrices.group",
      "subProducts.sizes.countryGroupPrices.price",
    ].join(" "))
    .skip(pageSize * (page - 1))
    .limit(pageSize);

  if (Object.keys(sortSpec).length) {
    query = query.sort(sortSpec);
  }

  const [productsDb, categories, subCategories, totalProducts] =
    await Promise.all([
      query.lean(),
      Category.find().select("_id name slug image").lean(),
      SubCategory.find()
        .select("_id name slug parent")
        .populate({ path: "parent", model: Category, select: "_id name slug" })
        .lean(),
      Product.countDocuments({
        ...search,
        ...category,
        ...brand,
        ...style,
        ...size,
        ...color,
        ...pattern,
        ...material,
        ...gender,
        ...price,
        ...shipping,
        ...rating,
        ...invalidCategoryFilter,
      }),
    ]);

  const products = sortQuery ? productsDb : randomize(productsDb);

  const safeCategories = categories.map((c: BrowseCategoryDoc) => ({
    _id: String(c._id),
    name: c.name ?? "",
    slug: c.slug ?? "",
    image: c.image ?? "",
  }));

  const safeSubCategories = subCategories.map((s: BrowseSubCategoryDoc) => ({
    _id: String(s._id),
    name: s.name ?? "",
    slug: s.slug ?? "",
    parent: s.parent
      ? {
          _id: String(s.parent._id),
          name: s.parent.name ?? "",
          slug: s.parent.slug ?? "",
        }
      : null,
  }));

  const facetBaseFilter = {
    ...category,
    ...invalidCategoryFilter,
  };

  const [colors, brandsDb, sizes, details] = await Promise.all([
    Product.distinct("subProducts.color.color", facetBaseFilter) as Promise<string[]>,
    Product.distinct("brand", facetBaseFilter) as Promise<string[]>,
    Product.distinct("subProducts.sizes.size", facetBaseFilter) as Promise<string[]>,
    Product.distinct("details", facetBaseFilter),
  ]);
  const stylesDb = filterArray(details, "Style");
  const patternsDb = filterArray(details, "Pattern Type");
  const materialsDb = filterArray(details, "Material");

  const styles = removeDuplicates(stylesDb);
  const patterns = removeDuplicates(patternsDb);
  const materials = removeDuplicates(materialsDb);
  const brands = removeDuplicates(brandsDb);

  const paginationCount = Math.ceil(totalProducts / pageSize);

  const h = await headers();
  const countryCode = (
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    process.env.GEO_OVERRIDE ||
    "US"
  ).toUpperCase();

  const countryMap: Record<
    string,
    {
      code: string;
      name: string;
      flagEmoji: string;
      flagUrl: string;
    }
  > = {
    EG: {
      code: "EG",
      name: "Egypt",
      flagEmoji: "🇪🇬",
      flagUrl: "https://flagcdn.com/w40/eg.png",
    },
    MA: {
      code: "MA",
      name: "Morocco",
      flagEmoji: "🇲🇦",
      flagUrl: "https://cdn-icons-png.flaticon.com/512/197/197551.png?w=360",
    },
    US: {
      code: "US",
      name: "United States",
      flagEmoji: "🇺🇸",
      flagUrl: "https://cdn-icons-png.flaticon.com/512/197/197484.png?w=360",
    },
  };

  const country = countryMap[countryCode] ?? countryMap.US;

  // ------------------------ Render (server) ------------------------
  // Keep markup lean; Header + all interactivity live in the client.
  return (
    <div className={cls.browse}>
      <BrowseClient
        initial={{
          categories: safeCategories,
          subCategories: safeSubCategories,
          products: JSON.parse(JSON.stringify(products)),
          sizes,
          colors,
          brands,
          stylesData: styles,
          patterns,
          materials,
          paginationCount,
          activeCategory: resolvedCategoryId
            ? {
                id: resolvedCategoryId,
                name: resolvedCategoryName,
                query: categoryQueryRaw,
              }
            : null,
          country,
        }}
      />
    </div>
  );
}
