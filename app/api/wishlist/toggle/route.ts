type WishlistEntryLean = {
  _id?: unknown;
  product?: unknown;
  style?: unknown; // may be string or number depending on legacy data
};

function getUserId(u: unknown): string | null {
  if (typeof u === "object" && u !== null && "id" in u) {
    const id = (u as { id: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}
// app/api/wishlist/toggle/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/utils/db";
import User from "@/models/User";

/**
 * Toggle a wishlist item for the logged-in user.
 * Expects JSON body like:
 * {
 *   productId: string,        // required (Product _id)
 *   subProductId?: string,    // style index as string (e.g. "0")
 *   size?: string,            // optional (ignored by /profile/wishlist page)
 *   color?: string            // optional (ignored by /profile/wishlist page)
 *   ... other fields are ignored here
 * }
 *
 * Returns: { key: string, inWishlist: boolean }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const productId = String(body?.productId ?? "");
  const styleIndex = Number(body?.subProductId ?? body?.style ?? 0);

  if (!productId || Number.isNaN(styleIndex)) {
    return NextResponse.json(
      { message: "Missing productId or invalid style index." },
      { status: 400 }
    );
  }

  // simple stable key (product|style)
  const key = [productId, String(styleIndex)].join("|");

  await connectDb();

  const userId = getUserId(session.user);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Find existing wishlist item (by product + style)
  const userDoc = await User.findById(userId).select("wishlist").lean();
  const existing = (userDoc?.wishlist ?? []).find((w: WishlistEntryLean) => {
    const prod = String(w?.product ?? "");
    const sVal = w?.style;
    const sNum = typeof sVal === "string" ? Number(sVal) : Number(sVal ?? 0);
    return prod === productId && sNum === styleIndex;
  });

  if (existing?._id) {
    // remove it
    await User.updateOne(
      { _id: userId },
      { $pull: { wishlist: { _id: existing._id } } }
    );
    return NextResponse.json({ key, inWishlist: false }, { status: 200 });
  } else {
    // add it
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          wishlist: {
            product: productId,
            style: String(styleIndex),
            addedAt: new Date().toISOString(),
          },
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ key, inWishlist: true }, { status: 200 });
  }
}