// app/api/user/saveCart/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import CartModel, { type ICart, type ICartProduct } from "@/models/Cart";
import UserModel from "@/models/User";
import { Types } from "mongoose";

type MinimalColor = { color?: string; image?: string };
type MinimalSubProduct = { images?: string[]; color?: MinimalColor };
type WithSubProducts = { subProducts?: MinimalSubProduct[] };

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

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

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

  // style often arrives as "0" — coerce and validate
  const styleIdx = Number(item.style);
  if (!Number.isFinite(styleIdx)) continue;

  if (typeof item.size !== "string" || !item.size) continue;

  const qty = Math.max(1, Number(item.qty || 1));

  // DO NOT .lean() because we need instance methods
  const productDoc = await ProductModel.findById(item.productId);
  if (!productDoc) continue;
  const subs = (productDoc as unknown as WithSubProducts).subProducts ?? [];
  const sub: MinimalSubProduct | undefined = subs[styleIdx];
  if (!sub) continue;

  // price
  const priceInfo = productDoc.getFinalPriceFor(styleIdx, item.size, countryISO2, { countryGroups });
  if (!priceInfo) continue;

  const unitPrice = Number(priceInfo.discountedPrice);
  const lineTotal = unitPrice * qty;

  // image precedence: color.image > sub.images[0] > first image across subs
  const colorImg =
    (item.color?.image && typeof item.color.image === "string" && item.color.image) ||
    (sub?.color?.image && typeof sub.color.image === "string" && sub.color.image) ||
    undefined;

  const subPrimary: string | undefined =
  Array.isArray(sub?.images) && sub.images.length > 0 ? sub.images[0] : undefined;

  const firstFromAnySub: string | undefined =
  subs.find((sp) => Array.isArray(sp.images) && sp.images.length > 0)?.images?.[0];

  const chosenImage = colorImg || subPrimary || firstFromAnySub || "";

  products.push({
    product: productDoc._id as unknown as Types.ObjectId,
    name: productDoc.name,
    image: chosenImage,                              // ✅ use the computed image
    style: styleIdx,                                 // ✅ persist style
    size: item.size,
    qty,
    color: {
      color: item.color?.color ?? sub?.color?.color ?? "",
      image: item.color?.image ?? sub?.color?.image ?? "",
    },
    price: unitPrice,
  });

  cartTotal += lineTotal;
}

    if (products.length === 0) {
      return NextResponse.json({ message: "No valid products to save." }, { status: 400 });
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

    return NextResponse.json({ message: "Cart saved", cartId: saved?._id, cart: saved }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save cart";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}