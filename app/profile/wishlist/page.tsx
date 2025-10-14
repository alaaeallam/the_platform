// app/profile/wishlist/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Layout from "@/components/profile/layout";
import User from "@/models/User";

function getUserId(u: unknown): string | null {
  if (typeof u === "object" && u !== null && "id" in u) {
    const id = (u as { id: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}
import { connectDb } from "@/utils/db";
import styles from "@/app/styles/profile.module.scss";
import WishlistClient from "@/components/profile/wishlist/WishlistClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "My Wishlist",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/profile/wishlist");

  const sp = await searchParams;
  const tabParam = sp?.tab;
  const tab =
    typeof tabParam === "string"
      ? Number(tabParam) || 0
      : Array.isArray(tabParam)
      ? Number(tabParam[0]) || 0
      : 0;

  await connectDb();

  // fetch user's wishlist items
  const userId = getUserId(session.user);
  if (!userId) redirect("/signin?callbackUrl=/profile/wishlist");

  const userDoc = await User.findById(userId)
    .select("wishlist")
    .populate("wishlist.product")
    .lean();

  type WishlistEntryLean = {
    _id?: unknown;
    product?: {
      _id?: unknown;
      name?: string;
      slug?: string;
      subProducts?: Array<{ images?: string[] }>;
    } | null;
    style?: unknown; // may be string or number
  };

  const wishlistRaw: unknown = (userDoc && typeof userDoc === "object" && "wishlist" in userDoc)
    ? (userDoc as { wishlist?: unknown }).wishlist
    : undefined;
  const wishlistArr: WishlistEntryLean[] = Array.isArray(wishlistRaw)
    ? (wishlistRaw as WishlistEntryLean[])
    : [];

  const wishlist = wishlistArr.map((item) => {
    const styleIdxRaw = item?.style;
    const styleIdx = typeof styleIdxRaw === "string" ? Number(styleIdxRaw) : Number(styleIdxRaw ?? 0);
    const prod = item?.product ?? undefined;
    const firstImage = prod?.subProducts?.[Number.isFinite(styleIdx) ? styleIdx : 0]?.images?.[0] ?? "";
    return {
      _id: String(item?._id ?? ""),
      productId: String(prod?._id ?? ""),
      name: prod?.name ?? "",
      slug: prod?.slug ?? "",
      image: firstImage,
      style: Number.isFinite(styleIdx) ? styleIdx : 0,
    };
  });

  return (
    <Layout user={session.user} tab={tab}>
      <div className={styles.header}>
        <h1>MY WISHLIST</h1>
      </div>
      <WishlistClient wishlist={wishlist} />
    </Layout>
  );
}