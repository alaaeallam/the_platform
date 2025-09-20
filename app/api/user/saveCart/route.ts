// app/api/user/saveCart/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import CartModel, { type ICart, type ICartProduct } from "@/models/Cart";
import UserModel from "@/models/User";
import { Types } from "mongoose";

/* ---------- Request payload ---------- */
type IncomingCartItem = {
  productId: string;
  style: number;
  size: string;
  qty: number;
  color?: { color?: string; image?: string };
};
type SaveCartBody = {
  cart: IncomingCartItem[];
  country?: string;
  countryGroups?: Record<string, string[]>;
};

/* ---------- Helpers ---------- */
const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

/* ---------- Route ---------- */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as SaveCartBody;
    const items = Array.isArray(body?.cart) ? body.cart : [];
    if (!items.length) {
      return NextResponse.json({ message: "No valid products to save." }, { status: 400 });
    }

    await dbConnect();

    const user = await UserModel.findById(session.user.id)
      .select("_id")
      .lean<{ _id: Types.ObjectId }>();
    if (!user?._id) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const countryISO2 = (body.country || "US").toUpperCase();
    const countryGroups = body.countryGroups;

    const products: ICartProduct[] = [];
    let cartTotal = 0;

    for (const item of items) {
      if (!item?.productId || !isValidObjectId(item.productId)) continue;
      if (typeof item.style !== "number" || !item.size) continue;
      const qty = Math.max(1, Number(item.qty || 1));

      // must NOT use .lean() here so mongoose methods exist
      const productDoc = await ProductModel.findById(item.productId);
      if (!productDoc) continue;

      const sub = productDoc.subProducts?.[item.style];
      if (!sub) continue;

      const firstImage = sub.images?.[0] || "";

      const priceInfo = productDoc.getFinalPriceFor(
        item.style,
        item.size,
        countryISO2,
        { countryGroups }
      );
      if (!priceInfo) continue;

      // per-unit, discounted, without shipping
      const unitPrice = Number(priceInfo.discountedPrice);
      const lineTotal = unitPrice * qty;

      // If you want shipping included in cartTotal, use:
      // const lineTotal = (unitPrice + Number(priceInfo.shipping || 0)) * qty;

      products.push({
        product: productDoc._id as unknown as Types.ObjectId,
        name: productDoc.name,
        image: firstImage,
        size: item.size,
        qty,
        color: {
          color: item.color?.color ?? sub.color?.color ?? "",
          image: item.color?.image ?? sub.color?.image ?? "",
        },
        price: unitPrice,
      });

      cartTotal += lineTotal;
    }

    // (1) If everything filtered out, don’t write an empty doc
    if (products.length === 0) {
      return NextResponse.json(
        { message: "No valid products to save." },
        { status: 400 }
      );
    }

    const saved = await CartModel.findOneAndUpdate(
      { user: user._id },
      {
        products,
        cartTotal: Number(cartTotal.toFixed(2)),
        totalAfterDiscount: undefined,
        user: user._id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean<ICart>();

    return NextResponse.json(
      { message: "Cart saved", cartId: saved?._id, cart: saved },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save cart";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}