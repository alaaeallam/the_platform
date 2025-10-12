// app/(admin)/admin/dashboard/products/create/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import db from "@/utils/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Layout from "@/components/admin/layout";
import CreateProductClient from "@/components/admin/products/create/CreateProductClient";

import styles from "@/app/styles/products.module.scss";

/* ---------- Types exposed to the client component ---------- */
export type ParentVM = {
  _id: string;
  name?: string;
  // Add anything your selects need:
  // subProducts?: unknown;
};

export type CategoryVM = {
  _id: string;
  name?: string;
};

async function loadData(): Promise<{ parents: ParentVM[]; categories: CategoryVM[] }> {
  await db.connectDb();

  const parents = await Product.find({})
    .select("name") // keep it light; add `subProducts` if your UI needs them
    .lean<{ _id: unknown; name?: string }[]>();

  const categories = await Category.find({})
    .lean<{ _id: unknown; name?: string }[]>();

  // normalize ObjectId -> string
  const normalizeId = <T extends { _id: unknown }>(arr: T[]) =>
    arr.map((d) => ({ ...d, _id: String(d._id) }));

  return {
    parents: normalizeId(parents),
    categories: normalizeId(categories),
  };
}

export default async function CreateProductPage(): Promise<React.JSX.Element> {
  const { parents, categories } = await loadData();

  return (
    <Layout>
      <div className={styles.header}>Create Product</div>
      <CreateProductClient parents={parents} categories={categories} />
    </Layout>
  );
}