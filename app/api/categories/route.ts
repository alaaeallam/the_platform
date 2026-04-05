import { NextResponse } from "next/server";

import Category from "@/models/Category";
import { connectDb } from "@/utils/db";
export const revalidate = 60;
type CategoryLean = {
  _id: unknown;
  name?: string;
  slug?: string;
  image?: string;
  iconKey?: string;
  parent?: string | null;
};

export async function GET() {
  try {
    await connectDb();

    const categories = await Category.find({})
      .sort({ updatedAt: -1 })
      .lean<CategoryLean[]>();

    return NextResponse.json(
      {
        categories: categories.map((category) => ({
          _id: String(category._id),
          name: category.name ?? "Category",
          slug: category.slug ?? "",
          image: category.image ?? "",
          iconKey: category.iconKey ?? "generic",
          parent: category.parent ?? null,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories.";

    return NextResponse.json({ message }, { status: 500 });
  }
}