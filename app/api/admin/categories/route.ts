// app/api/admin/categories/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { getServerSession } from "next-auth";

import { connectDb } from "@/utils/db";
import Category from "@/models/Category";
import { authOptions } from "@/lib/auth";

/* =========================
   Types
   ========================= */

type Role = "admin" | "customer";

type CategoryLean = {
  _id: unknown;
  name: string;
  slug?: string;
  parent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type CategoryVM = {
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
   Validation
   ========================= */

const CreateSchema = z.object({
  name: z.string().min(2, "Category name must be between 2 and 30 characters.")
    .max(30, "Category name must be between 2 and 30 characters."),
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(30),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

/* =========================
   Helpers
   ========================= */

function serialize(cats: CategoryLean[]): CategoryVM[] {
  return cats.map((c) => ({
    _id: String(c._id),
    name: c.name,
    slug: c.slug,
    parent: c.parent ?? null,
    createdAt: c.createdAt ? c.createdAt.toISOString() : undefined,
    updatedAt: c.updatedAt ? c.updatedAt.toISOString() : undefined,
  }));
}

/** Ensures the current session exists and is admin. Returns `NextResponse` if forbidden. */
async function assertAdminOrResponse(): Promise<NextResponse<ApiErr> | void> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!session || role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

/* =========================
   GET  /api/admin/categories
   (Optional: list all)
   ========================= */
export async function GET() {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    await connectDb();
    const docs = await Category.find({}).sort({ updatedAt: -1 }).lean<CategoryLean[]>();
    return NextResponse.json<ApiOk<{ categories: CategoryVM[] }>>(
      { categories: serialize(docs) },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch categories.";
    return NextResponse.json<ApiErr>({ message }, { status: 500 });
  }
}

/* =========================
   POST /api/admin/categories
   body: { name }
   ========================= */
export async function POST(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const body = await req.json();
    const { name } = CreateSchema.parse(body);

    await connectDb();

    const exists = await Category.findOne({ name }).lean();
    if (exists) {
      return NextResponse.json<ApiErr>(
        { message: "Category already exists. Try a different name." },
        { status: 400 }
      );
    }

    await Category.create({ name, slug: slugify(name) });

    const docs = await Category.find({}).sort({ updatedAt: -1 }).lean<CategoryLean[]>();
    return NextResponse.json<ApiOk<{ categories: CategoryVM[] }>>(
      {
        message: `Category "${name}" has been created successfully.`,
        categories: serialize(docs),
      },
      { status: 201 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to create category.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* =========================
   PUT /api/admin/categories
   body: { id, name }
   ========================= */
export async function PUT(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const body = await req.json();
    const { id, name } = UpdateSchema.parse(body);

    await connectDb();
    await Category.findByIdAndUpdate(id, { name, slug: slugify(name) });

    const docs = await Category.find({}).sort({ updatedAt: -1 }).lean<CategoryLean[]>();
    return NextResponse.json<ApiOk<{ categories: CategoryVM[] }>>(
      {
        message: "Category has been updated successfully.",
        categories: serialize(docs),
      },
      { status: 200 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to update category.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

/* =========================
   DELETE /api/admin/categories
   body: { id }
   ========================= */
export async function DELETE(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const body = await req.json();
    const { id } = DeleteSchema.parse(body);

    await connectDb();
    await Category.findByIdAndDelete(id);

    const docs = await Category.find({}).sort({ updatedAt: -1 }).lean<CategoryLean[]>();
    return NextResponse.json<ApiOk<{ categories: CategoryVM[] }>>(
      {
        message: "Category has been deleted successfully.",
        categories: serialize(docs),
      },
      { status: 200 }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input." :
      e instanceof Error ? e.message :
      "Failed to delete category.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}