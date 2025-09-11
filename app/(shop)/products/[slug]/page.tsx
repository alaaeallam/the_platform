// app/(shop)/products/[slug]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Product, { type IProduct } from "@/models/Product";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import User from "@/models/User";
import styles from "@/app/styles/product.module.scss";

import ProductDetailsClient from "@/components/productPage/ProductDetailsClient";
import { buildProductViewModel } from "@/lib/viewModels";
import type { CountryGroupsMap } from "@/lib/pricing";          // <— add
import type { ProductInfosVM } from "@/components/productPage/infos"; // <— add

type PageProps = {
  // Next 15 app router passes these as Promises to server components:
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

  const product: IProduct = productDoc.toObject<IProduct>();

  const countryISO2 = (qs?.country ?? "MA").toUpperCase();

  const groups: CountryGroupsMap = {
    MA: ["LOW_ECONOMY", "MENA"],
    EG: ["LOW_ECONOMY", "MENA"],
    US: ["HIGH_ECONOMY"],
  };

  // Build a typed view-model
  const vm: ProductInfosVM = buildProductViewModel(product, {
    styleIndex,
    sizeIndex,
    countryISO2,
    countryGroups: groups,
  });

  // Strip any non-serializable bits before passing to client:
  const viewModel: ProductInfosVM = JSON.parse(JSON.stringify(vm));

  const categoryName = (product.category as { name?: string } | undefined)?.name;
  const subCats = (product.subCategories as Array<{ _id?: unknown; name?: string }> | undefined) ?? [];

  return (
    <div className={styles.product}>
      <div className={styles.product__container}>
        <div className={styles.path}>
          Home {categoryName ? ` / ${categoryName}` : ""}
          {subCats.map((sub) => (
            <span key={String(sub?._id)}> / {String(sub?.name)}</span>
          ))}
        </div>

        <ProductDetailsClient viewModel={viewModel} />
      </div>
    </div>
  );
}