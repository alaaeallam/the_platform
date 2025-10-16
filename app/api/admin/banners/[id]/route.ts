// app/api/admin/banners/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDb } from "@/utils/db";
import Banner from "@/models/Banner";
import { revalidateTag } from "next/cache";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await connectDb();
  const body = await req.json();

  const doc = await Banner.findByIdAndUpdate(
    id,
    {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
      ...(body.image !== undefined && { image: body.image }),
      ...(body.mobileImage !== undefined && { mobileImage: body.mobileImage }),
      ...(body.ctaLabel !== undefined && { ctaLabel: body.ctaLabel }),
      ...(body.ctaHref !== undefined && { ctaHref: body.ctaHref }),
      ...(body.theme !== undefined && { theme: body.theme }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.priority !== undefined && { priority: Number(body.priority) }),
      ...(body.locale !== undefined && { locale: body.locale }),
      ...(body.startsAt !== undefined && { startsAt: body.startsAt ? new Date(body.startsAt) : null }),
      ...(body.endsAt !== undefined && { endsAt: body.endsAt ? new Date(body.endsAt) : null }),
    },
    { new: true }
  );

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidateTag("banners");
  revalidateTag(`banners:${doc.placement}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await connectDb();
  const doc = await Banner.findByIdAndDelete(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidateTag("banners");
  revalidateTag(`banners:${doc.placement}`);

  return NextResponse.json({ ok: true });
}