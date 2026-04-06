// app/(admin)/admin/dashboard/products/create/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import { connectDb } from "@/utils/db";
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
  await connectDb();

  const parents = await Product.find({})
  .select("_id name")
  .lean<{ _id: unknown; name?: string }[]>();

  const categories = await Category.find({})
  .select("_id name")
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
  try {
    const { parents, categories } = await loadData();
    return (
      <Layout>
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1.5rem 1rem 6rem",
          }}
        >
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1.25rem 1.5rem",
              borderRadius: "18px",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div className={styles.header} style={{ marginBottom: "0.35rem" }}>
              Create Product
            </div>
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              Add a new product, configure its variants, pricing, details, and marketing tags.
            </p>
          </div>

          <div
            style={{
              padding: "1.5rem",
              borderRadius: "20px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
            }}
          >
            <CreateProductClient
              parents={parents}
              categories={categories}
              mode="create"
            />
          </div>
        </section>
      </Layout>
    );
  } catch {
    // Render a minimal shell so Next can still resolve the module during build
    return (
      <Layout>
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1.5rem 1rem 6rem",
          }}
        >
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1.25rem 1.5rem",
              borderRadius: "18px",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div className={styles.header} style={{ marginBottom: "0.35rem" }}>
              Create Product
            </div>
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              Add a new product, configure its variants, pricing, details, and marketing tags.
            </p>
          </div>

          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: "16px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontWeight: 600,
            }}
          >
            Failed to load data. Check DB connection and environment variables.
          </div>
        </section>
      </Layout>
    );
  }
}