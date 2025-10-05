export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import db from "@/utils/db";
import Product from "@/models/Product";
import Category from "@/models/Category";

import Layout from "@/components/admin/layout";
import ProductCard, {
  type ProductCardProduct,
  type SubProduct,
} from "@/components/admin/products/productCard";
import styles from "@/components/admin/products/productCard/styles.module.scss";

/* Mongo lean types (partial) */
type PopulatedCategoryLean = { _id: unknown; name?: string | null };
type ProductLean = {
  _id: unknown;
  name: string;
  slug: string;
  category?: unknown;
  subProducts?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
  [k: string]: unknown;
};

function normalizeSubProducts(v: unknown): SubProduct[] {
  if (!Array.isArray(v)) return [];
  return v as SubProduct[];
}

function toCardProduct(p: ProductLean): ProductCardProduct {
  const category =
    typeof p.category === "string"
      ? p.category
      : p.category && typeof p.category === "object"
      ? {
          _id: String((p.category as PopulatedCategoryLean)._id),
          name: (p.category as PopulatedCategoryLean).name ?? "",
        }
      : null;

  return {
    _id: String(p._id),
    name: String(p.name),
    slug: String(p.slug),
    category,
    subProducts: normalizeSubProducts(p.subProducts),
  };
}

async function loadProducts(): Promise<ProductCardProduct[]> {
  await db.connectDb();
  const docs = await Product.find({})
    .populate({ path: "category", model: Category })
    .sort({ createdAt: -1 })
    .lean<ProductLean[]>();

  return docs.map(toCardProduct);
}

export default async function AllProductsPage(): Promise<React.JSX.Element> {
  const products = await loadProducts();

  return (
    <Layout>
      <div className={styles.header}>All Products</div>
      {products.map((product) => (
        <ProductCard product={product} key={product._id} />
      ))}
    </Layout>
  );
}