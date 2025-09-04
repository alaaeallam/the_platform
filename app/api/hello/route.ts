// app/api/hello/route.ts
import { NextResponse } from "next/server";
import {db} from "@/utils/db";

import { connectDb } from "@/utils/db";
export async function GET() {
  try {
    await connectDb();
    return NextResponse.json({ name: "John Doe" });
  } catch (error) {
    console.error("GET /api/hello error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}