// app/(shop)/checkout/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import db from "@/utils/db";
import User from "@/models/User";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

import CheckoutClient from "@/components/checkout/CheckoutClient";
import type {
  UserVM,
  CartVM,
  CartLine,
  Address as AddressVM,
} from "@/types/checkout";

/* ------------------------------------------------------------------ */
/* Route settings                                                      */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ------------------------------------------------------------------ */
/* Local types (minimal shapes we actually read)                       */
/* ------------------------------------------------------------------ */

type SessionUserLike = { id?: string; email?: string | null };

type ProductVariant = {
  images?: string[];
  color?: { color?: string; image?: string };
};

type ProductLean = {
  _id: unknown;
  name?: string;
  subProducts?: ProductVariant[];
};

type CartLineSnapshot = {
  _id?: unknown;
  product?: unknown;
  productId?: unknown;
  id?: unknown;
  style?: number | string;
  size?: string | number;
  qty?: number;
  price?: number;
  image?: string;
  color?: { color?: string; image?: string };
  name?: string;
  slug?: string;
};

type CartDocLean = {
  _id: unknown;
  user: unknown;
  products?: CartLineSnapshot[];
  cartTotal?: number;
  totalAfterDiscount?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type AddressDoc = {
  _id?: unknown;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address1?: string;
  address2?: string;
  country?: string;
  active?: boolean;
  id?: unknown;
};

type UserLean = {
  _id: unknown;
  name?: string;
  email?: string;
  image?: string;
  address?: AddressDoc[];
  addresses?: AddressDoc[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const s = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const idStr = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v instanceof mongoose.Types.ObjectId) return v.toHexString();
  try {
    const s = String(v ?? "");
    return s && s !== "[object Object]" ? s : "";
  } catch {
    return "";
  }
};

const toUndefined = <T,>(v: T | null | undefined): T | undefined =>
  v == null ? undefined : v;

const isValidId = (v: unknown): v is string =>
  typeof v === "string" && mongoose.Types.ObjectId.isValid(v);

/* ------------------------------------------------------------------ */
/* Page (Server Component)                                             */
/* ------------------------------------------------------------------ */

export default async function CheckoutPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
  }

  await db.connectDb();

  // Resolve the DB user by email (OAuth-friendly) then fall back to id.
  const u = session.user as unknown as SessionUserLike;

  const userDoc =
    (await User.findOne({ email: u.email }).lean<UserLean | null>()) ||
    (u.id ? await User.findById(u.id).lean<UserLean | null>() : null);

  if (!userDoc?._id) {
    await db.disconnectDb();
    redirect(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
  }

  const cartDoc = await Cart.findOne({ user: userDoc._id }).lean<CartDocLean | null>();
  if (!cartDoc) {
    await db.disconnectDb();
    redirect("/cart");
  }

  // ----------------- ENRICH LINES WITH NAME/IMAGE -----------------
  const rawLines: CartLineSnapshot[] = Array.isArray(cartDoc.products)
    ? cartDoc.products
    : [];

  // Collect distinct product ids from lines
  const productIds = [
    ...new Set(
      rawLines
        .map((p) => String(p?.product ?? p?.productId ?? p?.id ?? ""))
        .filter(isValidId)
    ),
  ];

  // Fetch only what we need
  const productDocs: ProductLean[] = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
        .select({ name: 1, subProducts: 1 })
        .lean<ProductLean[]>()
    : [];

  const productMap = new Map<string, ProductLean>();
  for (const doc of productDocs) productMap.set(String(doc._id), doc);

  // Build normalized + enriched cart lines
  const products: CartLine[] = rawLines.map((p): CartLine => {
    const pid = String(p?.product ?? p?.productId ?? p?.id ?? "");

    // Coerce style to number (handles "0" as well)
    const styleRaw = p.style;
    const style =
      typeof styleRaw === "number"
        ? styleRaw
        : Number.isFinite(Number(styleRaw))
        ? Number(styleRaw)
        : undefined;

    const doc = productMap.get(pid);
    const sub =
      style !== undefined && Array.isArray(doc?.subProducts)
        ? doc!.subProducts![style]
        : undefined;

    // 1) prefer the image stored on the line (what the user actually saw/selected)
    const lineImage =
  typeof p?.image === "string" && p.image.trim().length > 0 ? p.image : undefined;

    // 2) then the explicitly chosen color image (if present on the line)
    const colorImage =
      p?.color && typeof p.color.image === "string" && p.color.image.trim().length > 0
        ? p.color.image
        : undefined;

    // 3) then the variant image from the product
   const subPrimaryImage =
  Array.isArray(sub?.images) && sub.images.length > 0 ? sub.images[0] : undefined;

    // 4) fall back to the first available image across subProducts
    const firstImageFromAnySub =
      Array.isArray(doc?.subProducts)
        ? doc!.subProducts!.find(
            (s) => Array.isArray(s?.images) && s.images.length > 0
          )?.images?.[0]
        : undefined;

   const image =
  lineImage ||
  subPrimaryImage ||
  firstImageFromAnySub ||
  colorImage || // only if nothing else
  "/placeholder.png";

    const name =
      (typeof doc?.name === "string" && doc.name) ||
      (typeof p?.name === "string" && p.name) ||
      "Item";

    return {
      _id: idStr(p?._id),
      productId: idStr(p?.product ?? p?.productId ?? p?.id),
      // keep legacy `product` field if you rely on it elsewhere
      product:
        toUndefined(idStr(p?.product ?? p?.productId ?? "")) || undefined,
      style,
      size:
        typeof p?.size === "string"
          ? p.size
          : typeof p?.size === "number"
          ? p.size
          : (undefined as unknown as string), // preserves VM shape without `any`
      qty: Math.max(1, Number(p?.qty ?? 0)),
      price: typeof p?.price === "number" ? p.price : 0,
      image,
      color:
        p?.color && typeof p.color === "object"
          ? {
              image:
                typeof p.color.image === "string" ? p.color.image : undefined,
              color:
                typeof p.color.color === "string" ? p.color.color : undefined,
            }
          : undefined,
      name,
      slug: typeof p?.slug === "string" ? p.slug : undefined,
    };
  });

  // Compute subtotal defensively if the snapshot isn't present
  const computedSubtotal =
    products.reduce(
      (sum, l) => sum + (Number(l.price) || 0) * (Number(l.qty) || 0),
      0
    ) || 0;

  const cart: CartVM = {
    _id: idStr(cartDoc!._id),
    user: idStr(userDoc!._id),
    products,
    cartTotal: Number(cartDoc?.cartTotal ?? computedSubtotal) || 0,
    totalAfterDiscount:
      cartDoc?.totalAfterDiscount != null
        ? Number(cartDoc.totalAfterDiscount) || 0
        : undefined,
    createdAt: cartDoc?.createdAt
      ? new Date(cartDoc.createdAt as Date).toISOString()
      : undefined,
    updatedAt: cartDoc?.updatedAt
      ? new Date(cartDoc.updatedAt as Date).toISOString()
      : undefined,
  };

  // ---- map User to shared UserVM (no nulls; use undefined instead) ----
  const addressesSrc: AddressDoc[] =
  Array.isArray(userDoc.address)
    ? userDoc.address
    : Array.isArray(userDoc.addresses)
    ? userDoc.addresses
    : [];

  const address: AddressVM[] = addressesSrc.map((a) => ({
  _id: idStr(a?._id ?? a?.id),
  firstName: s(a?.firstName),
  lastName:  s(a?.lastName),
  phoneNumber: s(a?.phoneNumber ?? a?.phone),
  state:    s(a?.state),
  city:     s(a?.city),
  zipCode:  s(a?.zipCode),
  address1: s(a?.address1),
  address2: s(a?.address2 ?? ""),  // still a string, possibly empty
  country:  s(a?.country),
  active:   !!a?.active,
}));

  const user: UserVM = {
    _id: idStr(userDoc!._id),
    name: toUndefined(userDoc?.name),
    email: toUndefined(userDoc?.email),
    image: toUndefined(userDoc?.image) ?? "/avatar.png",
    address,
  };

  await db.disconnectDb();

  return <CheckoutClient user={user} cart={cart} />;
}