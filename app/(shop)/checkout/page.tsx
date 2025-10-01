// app/(shop)/checkout/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import db from "@/utils/db";                   // adjust if your db util exports differently
import User from "@/models/User";
import Cart from "@/models/Cart";

import CheckoutClient from "@/components/checkout/CheckoutClient";
import type { UserVM, CartVM, CartLine, Address as AddressVM } from "@/types/checkout";

/* ------------------------------------------------------------------ */
/* Route settings                                                      */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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
  const userDoc =
    (await User.findOne({ email: session.user.email }).lean()) ||
    (await User.findById((session.user as any)?.id).lean());

  if (!userDoc?._id) {
    await db.disconnectDb();
    redirect(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
  }

  const cartDoc = await Cart.findOne({ user: userDoc._id }).lean();

  if (!cartDoc) {
    await db.disconnectDb();
    redirect("/cart");
  }

  // ---- normalize products (lean → JSON-safe & typed) ----
  const products: CartLine[] = Array.isArray(cartDoc?.products)
    ? cartDoc.products.map((p: any): CartLine => ({
        _id: idStr(p?._id),
        productId: idStr(p?.product ?? p?.productId ?? p?.id),
        product: toUndefined(idStr(p?.product ?? p?.productId ?? "")) || undefined,
        style: typeof p?.style === "number" ? p.style : undefined,
        size:
          typeof p?.size === "string"
            ? p.size
            : typeof p?.size === "number"
            ? p.size
            : (undefined as any), // keep legacy tolerance
        qty: Math.max(1, Number(p?.qty ?? 0)),
        price: typeof p?.price === "number" ? p.price : 0,
        image: typeof p?.image === "string" ? p.image : undefined,
        color:
          p?.color && typeof p.color === "object"
            ? {
                image:
                  typeof p.color.image === "string" ? p.color.image : undefined,
                color:
                  typeof p.color.color === "string" ? p.color.color : undefined,
              }
            : undefined,
        name: typeof p?.name === "string" ? p.name : "Item",
        slug: typeof p?.slug === "string" ? p.slug : undefined,
      }))
    : [];

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
  const addressesSrc: any[] =
    (userDoc as any).address ?? (userDoc as any).addresses ?? [];
  const address: AddressVM[] = Array.isArray(addressesSrc)
    ? addressesSrc.map((a: any) => ({
        _id: idStr(a?._id ?? a?.id),
        firstName: toUndefined(a?.firstName),
        lastName: toUndefined(a?.lastName),
        phoneNumber: toUndefined(a?.phoneNumber ?? a?.phone),
        state: toUndefined(a?.state),
        city: toUndefined(a?.city),
        zipCode: toUndefined(a?.zipCode),
        address1: toUndefined(a?.address1),
        address2: toUndefined(a?.address2),
        country: toUndefined(a?.country),
        active: !!a?.active,
      }))
    : [];

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