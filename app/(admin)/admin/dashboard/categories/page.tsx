// app/(admin)/admin/dashboard/categories/page.tsx
import { connectDb } from "@/utils/db";
import Category from "@/models/Category";
import CategoriesClient from "./CategoriesClient"; // ← client component

export const dynamic = "force-dynamic";

export interface CategoryVM {
  _id: string;
  name: string;
  slug?: string;
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Server function
async function getCategories(): Promise<CategoryVM[]> {
  await connectDb();
  const categoriesRaw = await Category.find({})
    .sort({ updatedAt: -1 })
    .lean<
      {
        _id: unknown;
        name: string;
        slug?: string;
        parent?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
      }[]
    >();

  return categoriesRaw.map((c) => ({
    _id: String(c._id),
    name: c.name,
    slug: c.slug,
    parent: c.parent ?? null,
    createdAt: c.createdAt?.toISOString(),
    updatedAt: c.updatedAt?.toISOString(),
  }));
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories} />;
}