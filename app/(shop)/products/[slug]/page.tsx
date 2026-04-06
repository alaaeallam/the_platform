// app/(shop)/products/[slug]/page.tsx

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";

import Product, { type IProduct } from "@/models/Product";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import styles from "@/app/styles/product.module.scss";
import { connectDb } from "@/utils/db";
import ProductDetailsClient from "@/components/productPage/ProductDetailsClient";
import { buildProductViewModel } from "@/lib/viewModels";
import type { CountryGroupsMap } from "@/lib/pricing";
import type { ProductInfosVM } from "@/components/productPage/infos";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ style?: string; size?: string; country?: string }>;
};

export default async function ProductPage(props: PageProps) {
  await connectDb();

  const { slug } = await props.params;
  const qs = (props.searchParams ? await props.searchParams : {}) ?? {};

  const parsedStyleIndex = Number(qs?.style ?? 0);
  const parsedSizeIndex = Number(qs?.size ?? 0);
  const styleIndex = Number.isFinite(parsedStyleIndex) ? parsedStyleIndex : 0;
  const sizeIndex = Number.isFinite(parsedSizeIndex) ? parsedSizeIndex : 0;
  const productDoc = await Product.findOne({ slug })
    .select(
      [
        "_id",
        "name",
        "slug",
        "description",
        "details",
        "rating",
        "numReviews",
        "category",
        "subCategories",
        "shipping",
        "subProducts",
      ].join(" ")
    )
    .populate({ path: "category", model: Category, select: "name slug" })
    .populate({ path: "subCategories", model: SubCategory, select: "name slug" })
    .lean();
  if (!productDoc) return notFound();

  const product = productDoc as IProduct;

  const cookieStore = await cookies();
  const headerStore = await headers();

  const queryCountry = String(qs?.country ?? "").trim().toUpperCase();
  const geoCountry = String(headerStore.get("x-vercel-ip-country") ?? "")
    .trim()
    .toUpperCase();
  const cookieCountry = String(cookieStore.get("country")?.value ?? "")
    .trim()
    .toUpperCase();

  const isDev = process.env.NODE_ENV !== "production";
  const countryISO2 =
    (isDev ? queryCountry : "") || geoCountry || cookieCountry || "EG";

  const groups: CountryGroupsMap = {
    MA: ["LOW_ECONOMY", "MENA"],
    EG: ["LOW_ECONOMY", "MENA"],
    US: ["HIGH_ECONOMY"],
  };

  // If a country is not explicitly mapped, let the pricing layer fall back
  // to the product's base/default price rather than forcing Egypt pricing.
  const normalizedCountryISO2 = countryISO2;

  const vm = buildProductViewModel(product, {
    styleIndex,
    sizeIndex,
    countryISO2: normalizedCountryISO2,
    countryGroups: groups,
  });

  const viewModel: ProductInfosVM = {
    _id: String(vm._id),
    name: vm.name,
    slug: vm.slug,
    rating: Number(vm.rating ?? 0),
    numReviews: Number(vm.numReviews ?? 0),
    createdAt: String(vm.createdAt ?? ""),
    description: String(vm.description ?? ""),
    details: Array.isArray(vm.details)
      ? vm.details.map((d) => ({
          name: String(d.name ?? ""),
          value: String(d.value ?? ""),
        }))
      : [],
    style: Number(vm.style ?? 0),
    images: Array.isArray(vm.images) ? vm.images.map(String) : [],
    sizes: Array.isArray(vm.sizes)
      ? vm.sizes.map((s) => ({
          size: String(s.size ?? ""),
          qty: Number(s.qty ?? 0),
        }))
      : [],
    discount: Number(vm.discount ?? 0),
    sku: String(vm.sku ?? ""),
    colors: Array.isArray(vm.colors)
      ? vm.colors.map((c) => ({
          color: c.color ? String(c.color) : undefined,
          image: c.image ? String(c.image) : undefined,
        }))
      : [],
    priceRange: String(vm.priceRange ?? ""),
    price: Number(vm.price ?? 0),
    priceBefore: Number(vm.priceBefore ?? 0),
    quantity: Number(vm.quantity ?? 0),
    shipping: typeof vm.shipping === "number" ? vm.shipping : undefined,
    subProducts: Array.isArray(vm.subProducts)
      ? vm.subProducts.map((sp) => ({
          images: Array.isArray(sp.images) ? sp.images.map(String) : [],
        }))
      : [],
  };

  // ---------- Breadcrumbs (safe, typed) ----------
  const categoryName =
    (product.category as unknown as { name?: string } | null)?.name ?? "";

  type SubCatShallow = { _id?: unknown; name?: string };
  const subCats: SubCatShallow[] =
    (product.subCategories as unknown as SubCatShallow[]) ?? [];

  return (
    <div className={styles.product}>
      <div className={styles.product__container}>
        <div className={styles.path}>
          Home{categoryName ? ` / ${categoryName}` : ""}
          {subCats.map((sub) => (
            <span key={String(sub?._id)}> / {sub?.name}</span>
          ))}
        </div>

        <ProductDetailsClient viewModel={viewModel} />
      </div>
    </div>
  );
}