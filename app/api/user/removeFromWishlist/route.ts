// app/api/user/removeFromWishlist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDb } from "@/utils/db";

function getUserId(u: unknown): string | null {
  if (typeof u === "object" && u !== null && "id" in u) {
    const id = (u as { id: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

/**
 * Remove an item from the user's wishlist.
 * Method: PUT
 * Body: { wishlist_id: string }
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { wishlist_id } = await req.json();

    if (!wishlist_id) {
      return NextResponse.json(
        { message: "Missing wishlist item ID." },
        { status: 400 }
      );
    }

    await connectDb();

    const userId = getUserId(session.user);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { wishlist: { _id: wishlist_id } } }
    );

    return NextResponse.json({ message: "Removed from wishlist." }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred.";
    console.error("Wishlist remove error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}