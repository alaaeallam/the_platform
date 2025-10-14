// app/browse/page.tsx
import styles from "@/app/styles/browse.module.scss";
const cls = styles as Record<string, string>;
import BrowseClient from "@/components/browse/BrowseClient";

import { connectDb } from "@/utils/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import { filterArray, randomize, removeDuplicates } from "@/utils/arrays_utils";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Browse",
};

// ---------------------------- Types ----------------------------
export type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  // Next 15: searchParams is fine to type as a Promise for compatibility with streaming.
  searchParams: Promise<SearchParams>;
}


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
  const categoryQuery = getStr("category");
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
type SortSpec = Record<string, 1 | -1>;

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
  const category = categoryQuery ? { category: categoryQuery } : {};
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
  })
    .skip(pageSize * (page - 1))
    .limit(pageSize);

  if (Object.keys(sortSpec).length) {
    query = query.sort(sortSpec);
  }

  const productsDb = await query.lean();

  const products = sortQuery ? productsDb : randomize(productsDb);
  const categories = await Category.find().lean();
  const subCategories = await SubCategory.find()
    .populate({ path: "parent", model: Category })
    .lean();

  const colors = (await Product.find({ ...category }).distinct(
    "subProducts.color.color"
  )) as string[];
  const brandsDb = (await Product.find({ ...category }).distinct("brand")) as string[];
  const sizes = (await Product.find({ ...category }).distinct(
    "subProducts.sizes.size"
  )) as string[];
  const details = await Product.find({ ...category }).distinct("details");
  const stylesDb = filterArray(details, "Style");
  const patternsDb = filterArray(details, "Pattern Type");
  const materialsDb = filterArray(details, "Material");

  const styles = removeDuplicates(stylesDb);
  const patterns = removeDuplicates(patternsDb);
  const materials = removeDuplicates(materialsDb);
  const brands = removeDuplicates(brandsDb);

  const totalProducts = await Product.countDocuments({
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
  });

  const paginationCount = Math.ceil(totalProducts / pageSize);

  const country = {
    code: "MA",
    name: "Morocco",
    flagEmoji: "🇲🇦",
    flagUrl: "https://cdn-icons-png.flaticon.com/512/197/197551.png?w=360",
  };

  // ------------------------ Render (server) ------------------------
  // Keep markup lean; Header + all interactivity live in the client.
  return (
    <div className={cls.browse}>
      <BrowseClient
        initial={{
          categories: JSON.parse(JSON.stringify(categories)),
          subCategories: JSON.parse(JSON.stringify(subCategories)),
          products: JSON.parse(JSON.stringify(products)),
          sizes,
          colors,
          brands,
          stylesData: styles,
          patterns,
          materials,
          paginationCount,
          country,
        }}
      />
    </div>
  );
}
