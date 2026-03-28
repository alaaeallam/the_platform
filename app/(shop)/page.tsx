// app/(shop)/page.tsx
import { connectDb } from "@/utils/db";
import Category from "@/models/Category";
import HomePageClient from "./HomePageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


type HomeCategoryVM = {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
};


async function getHomeCategories(): Promise<HomeCategoryVM[]> {
  await connectDb();

  const categories = await Category.find({})
    .sort({ updatedAt: -1 })
    .limit(6)
    .lean<Array<{ _id: unknown; name?: string; slug?: string; image?: string }>>();

  return categories.map((category) => ({
    _id: String(category._id),
    name: category.name ?? "Category",
    slug: category.slug ?? "",
    image: category.image ?? "",
  }));
}

async function getMenuCategories(): Promise<HomeCategoryVM[]> {
  await connectDb();

  const categories = await Category.find({})
    .sort({ updatedAt: -1 })
    .lean<Array<{ _id: unknown; name?: string; slug?: string; image?: string }>>();

  return categories.map((category) => ({
    _id: String(category._id),
    name: category.name ?? "Category",
    slug: category.slug ?? "",
    image: category.image ?? "",
  }));
}

export default async function Page() {
  const initialCategories = await getHomeCategories();
  const menuCategories = await getMenuCategories();

  return (
    <>
      <HomePageClient initialCategories={initialCategories} menuCategories={menuCategories} />
    </>
  );
}