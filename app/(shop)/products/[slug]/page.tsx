// app/(shop)/products/[slug]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Product, { type IProduct } from "@/models/Product";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import User from "@/models/User";
import styles from "@/app/styles/product.module.scss";

import ProductDetailsClient from "@/components/productPage/ProductDetailsClient";
import { buildProductViewModel } from "@/lib/viewModels";
import type { CountryGroupsMap } from "@/lib/pricing";
import type { ProductInfosVM } from "@/components/productPage/infos";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ style?: string; size?: string; country?: string }>;
};

export default async function ProductPage(props: PageProps) {
  await dbConnect();

  const { slug } = await props.params;
  const qs = await props.searchParams;

  const styleIndex = Number(qs?.style ?? 0);
  const sizeIndex  = Number(qs?.size  ?? 0);

  const productDoc = await Product.findOne({ slug })
    .populate({ path: "category", model: Category })
    .populate({ path: "subCategories", model: SubCategory })
    .populate({ path: "reviews.reviewBy", model: User });

  if (!productDoc) return notFound();

  const product = productDoc.toObject<IProduct>();

  const cookieStore = await cookies();
  const cookieCountry = cookieStore.get("country")?.value;
  const countryISO2 = String(qs?.country ?? cookieCountry ?? "EG").toUpperCase();
  const groups: CountryGroupsMap = {
    MA: ["LOW_ECONOMY", "MENA"],
    EG: ["LOW_ECONOMY", "MENA"],
    US: ["HIGH_ECONOMY"],
  };

  const vm = buildProductViewModel(product, {
    styleIndex,
    sizeIndex,
    countryISO2,
    countryGroups: groups,
  });

  // Strip non-serializable fields
  const viewModel: ProductInfosVM = JSON.parse(JSON.stringify(vm));

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