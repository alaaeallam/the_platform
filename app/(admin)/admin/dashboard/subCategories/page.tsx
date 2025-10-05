import db from "@/utils/db";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import SubCategoriesClient from "./SubCategoriesClient";
import type { CategoryVM, SubCategoryServer } from "@/components/admin/subCategories/types";
import { toServerShape } from "@/components/admin/subCategories/types";
import { JSX } from "react";

export const dynamic = "force-dynamic";

async function loadCategories(): Promise<CategoryVM[]> {
  await db.connectDb();
  const rows = await Category.find({})
    .sort({ updatedAt: -1 })
    .lean<{ _id: unknown; name: string; slug?: string; parent?: string | null; createdAt?: Date; updatedAt?: Date }[]>();

  return rows.map((c) => ({
    _id: String(c._id),
    name: c.name,
    slug: c.slug ?? "",
    parent: c.parent ?? null,
    createdAt: c.createdAt?.toISOString(),
    updatedAt: c.updatedAt?.toISOString(),
  }));
}

async function loadSubCategories(): Promise<SubCategoryServer[]> {
  await db.connectDb();

  const rows = await SubCategory.find({})
    .populate({ path: "parent", model: Category, select: "_id name" })
    .sort({ updatedAt: -1 })
    .lean<
      {
        _id: unknown;
        name: string;
        slug?: string;
        parent?: string | { _id: unknown; name?: string } | null;
        createdAt?: Date;
        updatedAt?: Date;
      }[]
    >();

  // IMPORTANT: make the union shape explicit via the helper
  return rows.map(toServerShape);
}

export default async function SubCategoriesPage(): Promise<JSX.Element> {
  const [categories, subCategories] = await Promise.all([
    loadCategories(),
    loadSubCategories(),
  ]);

  return (
    <SubCategoriesClient
      categories={categories}
      initialSubCategories={subCategories}
    />
  );
}