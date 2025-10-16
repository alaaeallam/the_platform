// app/api/admin/banners/route.ts
import { NextResponse } from "next/server";
import { connectDb } from "@/utils/db";
import Banner from "@/models/Banner";
import { revalidateTag } from "next/cache";

export async function GET() {
  await connectDb();
  const rows = await Banner.find().sort({ updatedAt: -1 }).lean();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await connectDb();
  const body = await req.json();

  // basic validation
  if (!body.image || !body.placement) {
    return NextResponse.json({ error: "placement and image are required" }, { status: 400 });
  }

  const doc = await Banner.create({
    placement: body.placement ?? "home-hero",
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    image: body.image,
    mobileImage: body.mobileImage ?? "",
    ctaLabel: body.ctaLabel ?? "",
    ctaHref: body.ctaHref ?? "",
    theme: body.theme ?? { bg: "", fg: "", align: "center" },
    active: body.active ?? true,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    endsAt: body.endsAt ? new Date(body.endsAt) : null,
    priority: Number(body.priority ?? 0),
    locale: body.locale ?? "",
  });

  // revalidate home-hero banner caches
  revalidateTag("banners");
  revalidateTag(`banners:${doc.placement}`);

  return NextResponse.json({ ok: true, id: doc._id });
}