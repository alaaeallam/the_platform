// app/profile/wishlist/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { connectDb } from "@/utils/db";

import Layout from "@/components/profile/layout";
import WishlistClient from "@/components/profile/wishlist/WishlistClient";

import User from "@/models/User";

export const metadata: Metadata = {
  title: "My Wishlist",
};

// ---------------- Types ----------------
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type WishlistEntryLean = {
  _id?: unknown;
  product?: {
    _id?: unknown;
    name?: string;
    slug?: string;
    subProducts?: Array<{ images?: string[] }>;
  } | null;
  style?: unknown; // string | number | undefined
};

function getUserId(u: unknown): string | null {
  if (typeof u === "object" && u !== null && "id" in u) {
    const id = (u as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

// --------------- Page ---------------
export default async function WishlistPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Ensure session
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/profile/wishlist");

  // Parse tab
  const sp = await searchParams;
  const tabParam = sp?.tab;
  const tab =
    typeof tabParam === "string"
      ? Number(tabParam) || 0
      : Array.isArray(tabParam)
      ? Number(tabParam[0]) || 0
      : 0;

  // DB connection (important on Vercel)
  await connectDb();

  // User id
  const userId = getUserId(session.user);
  if (!userId) redirect("/signin?callbackUrl=/profile/wishlist");

  // Fetch wishlist (lean + selective populate)
  const userDoc = await User.findById(userId)
    .select("wishlist")
    .populate({
      path: "wishlist.product",
      select: "name slug subProducts",
    })
    .lean<{ wishlist?: WishlistEntryLean[] } | null>();

  const wishlistArr: WishlistEntryLean[] = Array.isArray(userDoc?.wishlist)
    ? userDoc!.wishlist!
    : [];

  // Shape to plain client data
  const wishlist = wishlistArr.map((item) => {
    const styleIdxRaw = item?.style;
    const styleIdx =
      typeof styleIdxRaw === "string"
        ? Number(styleIdxRaw)
        : typeof styleIdxRaw === "number"
        ? styleIdxRaw
        : 0;

    const prod = item?.product ?? undefined;
    const firstImage =
      prod?.subProducts?.[
        Number.isFinite(styleIdx) && styleIdx >= 0 ? styleIdx : 0
      ]?.images?.[0] ?? "";

    return {
      _id: String(item?._id ?? ""),
      productId: String(prod?._id ?? ""),
      name: prod?.name ?? "",
      slug: prod?.slug ?? "",
      image: firstImage,
      style: Number.isFinite(styleIdx) ? styleIdx : 0,
    };
  });

  // Render
  return (
    <Layout user={session.user} tab={tab}>
      <div className="sr-only" aria-hidden />{/* keep header spacing minimal */}
      <div className="profileHeader">
        <h1>MY WISHLIST</h1>
      </div>
      <WishlistClient wishlist={wishlist} />
    </Layout>
  );
}