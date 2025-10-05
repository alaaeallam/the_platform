// app/api/admin/sub-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { getServerSession } from "next-auth";

import { connectDb } from "@/utils/db";
import SubCategory from "@/models/SubCategory";
import Category from "@/models/Category"; // optional: used to validate parent existence
import { authOptions } from "@/lib/auth";

/* =========================
   Types
   ========================= */

type Role = "admin" | "customer";

type SubCategoryLean = {
  _id: unknown;
  name: string;
  slug?: string;
  parent?: unknown | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type SubCategoryVM = {
  _id: string;
  name: string;
  slug?: string;
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiOk<T> = { message?: string } & T;
type ApiErr = { message: string };

/* =========================
   Validation (Zod)
   ========================= */

const CreateSchema = z.object({
  name: z.string().min(2).max(30),
  parent: z.string().min(1), // parent Category id
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(30),
  parent: z.string().min(1),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

/* =========================
   Helpers
   ========================= */

function serialize(docs: SubCategoryLean[]): SubCategoryVM[] {
  return docs.map((d) => ({
    _id: String(d._id),
    name: d.name,
    slug: d.slug,
    parent: d.parent ? String(d.parent) : null,
    createdAt: d.createdAt?.toISOString(),
    updatedAt: d.updatedAt?.toISOString(),
  }));
}

async function assertAdminOrResponse(): Promise<NextResponse<ApiErr> | void> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!session || role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

/* =========================
   GET /api/admin/sub-categories?category=<categoryId>
   Returns sub-categories of a given category (admin-only to match legacy)
   ========================= */
export async function GET(req: NextRequest) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const categoryId = req.nextUrl.searchParams.get("category");
    if (!categoryId) {
      // Match legacy behavior: return empty array if no query
      return NextResponse.json<SubCategoryVM[]>([], { status: 200 });
    }

    await connectDb();

    const docs = await SubCategory.find({ parent: categoryId })
      .select("name slug parent createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean<SubCategoryLean[]>();

    return NextResponse.json<SubCategoryVM[]>(serialize(docs), { status: 200 });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch sub-categories.";
    return NextResponse.json<ApiErr>({ message }, { status: 500 });
  }
}

/* =========================
   POST /api/admin/sub-categories
   body: { name, parent }
   ========================= */
export async function POST(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const parsed = CreateSchema.parse(await req.json());
    await connectDb();

    // Optional: ensure parent category exists
    const parentExists = await Category.exists({ _id: parsed.parent });
    if (!parentExists) {
      return NextResponse.json<ApiErr>(
        { message: "Parent category not found." },
        { status: 400 }
      );
    }

    const duplicate = await SubCategory.findOne({ name: parsed.name }).lean();
    if (duplicate) {
      return NextResponse.json<ApiErr>(
        { message: "Sub-category already exists. Try a different name." },
        { status: 400 }
      );
    }

    await SubCategory.create({
      name: parsed.name,
      parent: parsed.parent,
      slug: slugify(parsed.name),
    });

    const docs = await SubCategory.find({})
      .sort({ updatedAt: -1 })
      .lean<SubCategoryLean[]>();

    return NextResponse.json<ApiOk<{ subCategories: SubCategoryVM[] }>>(
      {
        message: `Sub-category "${parsed.name}" has been created successfully.`,
        subCategories: serialize(docs),
      },
      { status: 201 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to create sub-category.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* =========================
   PUT /api/admin/sub-categories
   body: { id, name, parent }
   ========================= */
export async function PUT(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const parsed = UpdateSchema.parse(await req.json());
    await connectDb();

    // Optional: validate parent exists
    const parentExists = await Category.exists({ _id: parsed.parent });
    if (!parentExists) {
      return NextResponse.json<ApiErr>(
        { message: "Parent category not found." },
        { status: 400 }
      );
    }

    await SubCategory.findByIdAndUpdate(parsed.id, {
      name: parsed.name,
      parent: parsed.parent,
      slug: slugify(parsed.name),
    });

    const docs = await SubCategory.find({})
      .sort({ updatedAt: -1 })
      .lean<SubCategoryLean[]>();

    return NextResponse.json<ApiOk<{ subCategories: SubCategoryVM[] }>>(
      {
        message: "Sub-category has been updated successfully.",
        subCategories: serialize(docs),
      },
      { status: 200 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to update sub-category.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* =========================
   DELETE /api/admin/sub-categories
   body: { id }
   ========================= */
export async function DELETE(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const { id } = DeleteSchema.parse(await req.json());
    await connectDb();

    await SubCategory.findByIdAndDelete(id);

    const docs = await SubCategory.find({})
      .sort({ updatedAt: -1 })
      .lean<SubCategoryLean[]>();

    return NextResponse.json<ApiOk<{ subCategories: SubCategoryVM[] }>>(
      {
        message: "Sub-category has been deleted successfully.",
        subCategories: serialize(docs),
      },
      { status: 200 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to delete sub-category.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}