// app/(admin)/admin/dashboard/products/edit/[id]/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import * as React from "react";
import { connectDb } from "@/utils/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Layout from "@/components/admin/layout";
import CreateProductClient, {
  type ProductDraft,
} from "@/components/admin/products/create/CreateProductClient";
import styles from "@/app/styles/products.module.scss";

export type ParentVM = {
  _id: string;
  name?: string;
};

export type CategoryVM = {
  _id: string;
  name?: string;
};

type LeanImage = string | { url?: string | null };
type LeanSize = {
  size?: string;
  qty?: number;
  basePrice?: number;
  discount?: number;
  countryPrices?: Array<{ country?: string; price?: number }>;
  countryGroupPrices?: Array<{ groupCode?: string; price?: number }>;
};
type LeanSubProduct = {
  sku?: string;
  images?: LeanImage[];
  color?: { color?: string; image?: string };
  sizes?: LeanSize[];
  discount?: number;
};
type LeanProduct = {
  _id: unknown;
  name?: string;
  description?: string;
  brand?: string;
  category?: unknown;
  subCategories?: unknown[];
  details?: Array<{ name?: string; value?: string }>;
  questions?: Array<{ question?: string; answer?: string }>;
  shipping?: number;
  subProducts?: LeanSubProduct[];
};

function toImageUrl(img: LeanImage): string {
  if (typeof img === "string") return img;
  return img?.url ?? "";
}

function mapProductToDraft(product: LeanProduct): ProductDraft {
  const firstSub = product.subProducts?.[0];

  return {
    name: product.name ?? "",
    description: product.description ?? "",
    brand: product.brand ?? "",
    sku: firstSub?.sku ?? "",
    discount: Number(firstSub?.discount ?? 0),
    images: (firstSub?.images ?? [])
      .map((img) => {
        const url = toImageUrl(img);
        return url ? { url } : null;
      })
      .filter((img): img is { url: string } => img !== null),
    description_images: [],
    parent: "",
    category: product.category ? String(product.category) : "",
    subCategories: Array.isArray(product.subCategories)
      ? product.subCategories.map((id) => String(id))
      : [],
    color: {
      color: firstSub?.color?.color ?? "",
      image: firstSub?.color?.image ?? "",
    },
    sizes:
      firstSub?.sizes?.length
        ? firstSub.sizes.map((size) => ({
            size: size.size ?? "",
            qty: String(size.qty ?? ""),
            basePrice: String(size.basePrice ?? ""),
            discount:
              typeof size.discount === "number" ? String(size.discount) : "",
            countryPrices: Array.isArray(size.countryPrices)
              ? size.countryPrices.map((cp) => ({
                  country: cp.country ?? "",
                  price:
                    typeof cp.price === "number" ? String(cp.price) : "",
                }))
              : [],
            countryGroupPrices: Array.isArray(size.countryGroupPrices)
              ? size.countryGroupPrices.map((gp) => ({
                  groupCode: gp.groupCode ?? "",
                  price:
                    typeof gp.price === "number" ? String(gp.price) : "",
                }))
              : [],
          }))
        : [
            {
              size: "",
              qty: "",
              basePrice: "",
              discount: "",
              countryPrices: [],
              countryGroupPrices: [],
            },
          ],
    details:
      product.details?.length
        ? product.details.map((d) => ({
            name: d.name ?? "",
            value: d.value ?? "",
          }))
        : [{ name: "", value: "" }],
    questions:
      product.questions?.length
        ? product.questions.map((q) => ({
            question: q.question ?? "",
            answer: q.answer ?? "",
          }))
        : [{ question: "", answer: "" }],
    shippingFee:
      typeof product.shipping === "number" ? String(product.shipping) : "",
  };
}

async function loadData(id: string): Promise<{
  parents: ParentVM[];
  categories: CategoryVM[];
  product: ProductDraft | null;
}> {
  await connectDb();

  const [parents, categories, product] = await Promise.all([
    Product.find({ _id: { $ne: id } })
      .select("name")
      .lean<{ _id: unknown; name?: string }[]>(),
    Category.find({}).lean<{ _id: unknown; name?: string }[]>(),
    Product.findById(id).lean<LeanProduct | null>(),
  ]);

  const normalizeId = <T extends { _id: unknown }>(arr: T[]) =>
    arr.map((d) => ({ ...d, _id: String(d._id) }));

  return {
    parents: normalizeId(parents),
    categories: normalizeId(categories),
    product: product ? mapProductToDraft(product) : null,
  };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  try {
    const { id } = await params;
    const { parents, categories, product } = await loadData(id);

    if (!product) {
      return (
        <Layout>
          <div className={styles.header}>Edit Product</div>
          <p style={{ color: "#c00" }}>Product not found.</p>
        </Layout>
      );
    }

    return (
      <Layout>
        <div className={styles.header}>Edit Product</div>
        <CreateProductClient
          parents={parents}
          categories={categories}
          mode="edit"
          productId={id}
          initialProduct={product}
        />
      </Layout>
    );
  } catch {
    return (
      <Layout>
        <div className={styles.header}>Edit Product</div>
        <p style={{ color: "#c00" }}>
          Failed to load product. Check DB connection and route params.
        </p>
      </Layout>
    );
  }
}