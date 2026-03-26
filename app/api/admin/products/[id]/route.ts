// app/api/admin/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import slugify from "slugify";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth";
import { connectDb } from "@/utils/db";
import Product from "@/models/Product";

type Role = "admin" | "customer";
type ApiErr = { message: string };
type ApiErrZod = { message: string; issues: z.ZodIssue[] };

interface MongoServerError extends Error {
  code?: number;
  keyPattern?: Record<string, number>;
}

async function assertAdminOrResponse() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!session || role !== "admin") {
    return NextResponse.json<ApiErr>({ message: "Forbidden" }, { status: 403 });
  }
}

const ColorSchema = z.any();
const SizeSchema = z.any();

const UpdateProductSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().min(1),
  brand: z.string().min(1),
  details: z.any().optional(),
  questions: z.any().optional(),
  category: z.string().min(1),
  subCategories: z.array(z.string().min(1)).optional(),
  shipping: z.number().min(0).optional().default(0),

  sku: z.string().min(1),
  color: ColorSchema,
  images: z.array(z.string().url().or(z.string().min(1))).min(1),
  sizes: z.array(SizeSchema).min(1),
  discount: z.number().min(0).max(100).optional().default(0),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    await connectDb();

    const { id } = await ctx.params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json<ApiErr>(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch product.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const json = await req.json();
    const parsed = UpdateProductSchema.parse(json);

    await connectDb();

    const { id } = await ctx.params;
    const existing = await Product.findById(id);

    if (!existing) {
      return NextResponse.json<ApiErr>(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    const nextSlug =
      parsed.name && parsed.name !== existing.name
        ? slugify(parsed.name)
        : existing.slug;

    existing.name = parsed.name;
    existing.description = parsed.description;
    existing.brand = parsed.brand;
    existing.details = parsed.details ?? [];
    existing.questions = parsed.questions ?? [];
    existing.slug = nextSlug;
    existing.category = new mongoose.Types.ObjectId(parsed.category);
    existing.subCategories = (parsed.subCategories ?? [])
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
    existing.shipping = parsed.shipping ?? 0;

    existing.subProducts = [
      {
        sku: parsed.sku,
        color: parsed.color,
        images: parsed.images,
        sizes: parsed.sizes,
        discount: parsed.discount ?? 0,
        description_images: existing.subProducts?.[0]?.description_images ?? [],
        sold: existing.subProducts?.[0]?.sold ?? 0,
        marketingTags: existing.subProducts?.[0]?.marketingTags ?? [],
      },
    ] as any;

    await existing.save();

    return NextResponse.json(
      {
        message: "Product updated successfully.",
        productId: String(existing._id),
      },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      const payload: ApiErrZod = { message: "Invalid input", issues: e.issues };
      return NextResponse.json<ApiErrZod>(payload, { status: 400 });
    }

    const mongoErr = e as MongoServerError;
    if (mongoErr?.code === 11000) {
      const field = Object.keys(mongoErr.keyPattern ?? {})[0] || "unique field";
      return NextResponse.json<ApiErr>(
        { message: `Duplicate ${field}. Please use a different value.` },
        { status: 400 }
      );
    }

    const message = e instanceof Error ? e.message : "Failed to update product.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    await connectDb();

    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json<ApiErr>(
        { message: "Invalid product id." },
        { status: 400 }
      );
    }

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json<ApiErr>(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product deleted successfully." },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete product.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}