// app/api/admin/products/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import slugify from "slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth";
import { connectDb } from "@/utils/db";
import Product from "@/models/Product";

/* =========================
   Types
   ========================= */

type Role = "admin" | "customer";

type ApiOk<T> = { message: string } & T;
type ApiErr = { message: string };

// Extra typed helpers for errors
type ApiErrZod = { message: string; issues: z.ZodIssue[] };
interface MongoServerError extends Error {
  code?: number;
  keyPattern?: Record<string, number>;
}

/* =========================
   Validation (Zod)
   ========================= */

// Common pieces
const ColorSchema = z.any(); // if you have a strict shape, replace with z.object({ ... })
const SizeSchema = z.any();  // same note as above

const ImagesSchema = z.array(z.string().url().or(z.string().min(1))).min(1);
const SubCategoriesSchema = z.array(z.string().min(1)).optional();

// Creating a subProduct for an existing parent
const CreateSubProductSchema = z.object({
  parent: z.string().min(1),
  sku: z.string().min(1),
  color: ColorSchema, // e.g. { color: {image: string, color: string}, ... }
  images: ImagesSchema,
  sizes: z.array(SizeSchema).min(1),
  discount: z.number().min(0).max(100).optional().default(0),
});

// Creating a brand-new product (with its first subProduct)
const CreateProductSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().min(1),
  brand: z.string().min(1),
  details: z.any().optional(),   // replace with strict schema if you have it
  questions: z.any().optional(), // replace with strict schema if you have it
  category: z.string().min(1),
  subCategories: SubCategoriesSchema,
  shipping: z.number().min(0).optional().default(0),

  // first subProduct fields
  sku: z.string().min(1),
  color: ColorSchema,
  images: ImagesSchema,
  sizes: z.array(SizeSchema).min(1),
  discount: z.number().min(0).max(100).optional().default(0),
});

// Union: either we create a new product or append to parent
const BodySchema = z.union([CreateSubProductSchema, CreateProductSchema]);

/* =========================
   Helpers
   ========================= */

async function assertAdminOrResponse() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!session || role !== "admin") {
    return NextResponse.json<ApiErr>({ message: "Forbidden" }, { status: 403 });
  }
}

/* =========================
   POST /api/admin/products
   - with { parent, ... }  → append subProduct
   - without parent        → create new product
   ========================= */
export async function POST(req: Request) {
  try {
    const forbidden = await assertAdminOrResponse();
    if (forbidden) return forbidden;

    const json = await req.json();
    console.log("[/api/admin/products] incoming keys:", Object.keys(json));
    const parsed = BodySchema.parse(json);

    await connectDb();

    // Case 1: Append a subProduct to an existing parent
    if ("parent" in parsed) {
      const parent = await Product.findById(parsed.parent);
      if (!parent) {
        return NextResponse.json<ApiErr>(
          { message: "Parent product not found!" },
          { status: 400 }
        );
      }

      await parent.updateOne(
        {
          $push: {
            subProducts: {
              sku: parsed.sku,
              color: parsed.color,
              images: parsed.images,
              sizes: parsed.sizes,
              discount: parsed.discount ?? 0,
            },
          },
        },
        { new: true }
      );

      return NextResponse.json<ApiOk<{ productId: string }>>(
        { message: "Sub-product added successfully.", productId: String(parent._id) },
        { status: 200 }
      );
    }

    // Case 2: Create a brand-new product
    const slug = slugify(parsed.name);

    const created = await Product.create({
      name: parsed.name,
      description: parsed.description,
      brand: parsed.brand,
      details: parsed.details,
      questions: parsed.questions,
      slug,
      category: parsed.category,
      subCategories: parsed.subCategories ?? [],
      shipping: parsed.shipping ?? 0,
      subProducts: [
        {
          sku: parsed.sku,
          color: parsed.color,
          images: parsed.images,
          sizes: parsed.sizes,
          discount: parsed.discount ?? 0,
        },
      ],
    });

    return NextResponse.json<ApiOk<{ productId: string }>>(
      { message: "Product created successfully.", productId: String(created._id) },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      const payload: ApiErrZod = { message: "Invalid input", issues: e.issues };
      return NextResponse.json<ApiErrZod>(payload, { status: 400 });
    }
    // Handle Mongo duplicate key error (e.g., slug unique)
    const mongoErr = e as MongoServerError;
    if (mongoErr?.code === 11000) {
      const field = Object.keys(mongoErr.keyPattern ?? {})[0] || "unique field";
      return NextResponse.json<ApiErr>(
        { message: `Duplicate ${field}. Please use a different value.` },
        { status: 400 }
      );
    }
    const message = e instanceof Error ? e.message : "Failed to process request.";
    return NextResponse.json<ApiErr>({ message }, { status: 400 });
  }
}