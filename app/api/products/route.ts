// app/api/products/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";


export async function GET() {
  try {
    await dbConnect();
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .select("name slug subProducts rating numReviews createdAt")
      .lean();

    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}