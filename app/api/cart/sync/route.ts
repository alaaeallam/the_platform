// app/api/cart/sync/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import dbConnect from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import Cart from "@/models/Cart";

import { Types } from "mongoose";

/* ---------- Request/Response Types ---------- */

type ClientCartLine = {
  productId?: string;
  style?: number;       // subProduct index
  size?: string;        // size label (required)
  qty?: number;         // requested qty
  _uid?: string;        // legacy fallback (e.g. "<productId>_<style>_<sizeIdx>")
};

type CartSyncBody = {
  cart: ClientCartLine[];
  country?: string;               // ISO-2
  countryGroups?: Record<string, string[]>;
};

type SyncedCartLine = {
  productId: string;
  style: number;
  size: string;
  requestedQty: number;
  availableQty: number;
  qty: number;
  name: string;
  image: string;
  price: number;           // per-unit, discounted, excl. shipping
  shipping: number;        // per-unit shipping
  lineTotal: number;       // price * qty
  lineShipping: number;    // shipping * qty
  changed: boolean;
  reasons: Array<
    "MISSING" | "OOS" | "QTY_ADJUSTED" | "STRUCTURE_FIXED" | "NO_PRICE"
  >;
};

type CartSyncResponse = {
  lines: SyncedCartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  anyChanged: boolean;
  saved?: boolean;
};

/* ---------- Helpers ---------- */

function parseIdsFromUid(uid?: string): { productId?: string; style?: number } {
  const parts = String(uid || "").split("_");
  const productId = parts[0];
  const style = Number(parts[1]);
  return {
    productId: productId && Types.ObjectId.isValid(productId) ? productId : undefined,
    style: Number.isFinite(style) ? style : undefined,
  };
}

function isValidObjectId(id?: string): id is string {
  return !!id && Types.ObjectId.isValid(id);
}

/* ---------- Route ---------- */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as CartSyncBody;

    const items = Array.isArray(body?.cart) ? body.cart : [];
    const userIdFromSession = session?.user?.id ?? "";

    // Quick observability in the server console
    console.log("[/api/cart/sync] begin", {
      userIdFromSession,
      cartFromClientCount: items.length,
    });

    if (!items.length) {
      return NextResponse.json<CartSyncResponse>(
        { lines: [], subtotal: 0, shipping: 0, total: 0, anyChanged: false, saved: false },
        { status: 200 }
      );
    }

    if (!userIdFromSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const country = (body.country || "US").toUpperCase();
    const countryGroups = body.countryGroups;
    const out: SyncedCartLine[] = [];

    for (const raw of items) {
      // normalize identity
      let { productId, style } = raw;
      if (!isValidObjectId(productId) || typeof style !== "number") {
        const fallback = parseIdsFromUid(raw._uid);
        productId = productId ?? fallback.productId;
        style = typeof style === "number" ? style : fallback.style;
      }

      const requestedQty = Math.max(1, Number(raw.qty ?? 1));
      const sizeLabel = (raw.size ?? "").trim();

      // structural guard
      if (!isValidObjectId(productId) || typeof style !== "number" || !sizeLabel) {
        out.push({
          productId: productId ?? "unknown",
          style: typeof style === "number" ? style : -1,
          size: sizeLabel,
          requestedQty,
          availableQty: 0,
          qty: 0,
          name: "",
          image: "",
          price: 0,
          shipping: 0,
          lineTotal: 0,
          lineShipping: 0,
          changed: true,
          reasons: ["STRUCTURE_FIXED"],
        });
        continue;
      }

      const product = await ProductModel.findById(productId);
      if (!product) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[/api/cart/sync] product missing", { productId });
        }
        out.push({
          productId,
          style,
          size: sizeLabel,
          requestedQty,
          availableQty: 0,
          qty: 0,
          name: "",
          image: "",
          price: 0,
          shipping: 0,
          lineTotal: 0,
          lineShipping: 0,
          changed: true,
          reasons: ["MISSING"],
        });
        continue;
      }

      const sub = product.subProducts?.[style];
      const sizeRow = sub?.sizes?.find((s) => s.size === sizeLabel);

      if (!sub || !sizeRow) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[/api/cart/sync] sub/size missing", { productId, style, sizeLabel });
        }
        out.push({
          productId,
          style,
          size: sizeLabel,
          requestedQty,
          availableQty: 0,
          qty: 0,
          name: product.name,
          image: sub?.images?.[0] || "",
          price: 0,
          shipping: product.shipping || 0,
          lineTotal: 0,
          lineShipping: 0,
          changed: true,
          reasons: ["MISSING", "OOS"],
        });
        continue;
      }

      const availableQty = Math.max(0, Number(sizeRow.qty || 0));
      const qty = Math.min(requestedQty, availableQty);

      const fin = product.getFinalPriceFor(style, sizeLabel, country, { countryGroups });
      if (!fin) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[/api/cart/sync] price resolution failed", { productId, style, sizeLabel, country });
        }
        out.push({
          productId,
          style,
          size: sizeLabel,
          requestedQty,
          availableQty,
          qty: 0,
          name: product.name,
          image: sub.images?.[0] || "",
          price: 0,
          shipping: product.shipping || 0,
          lineTotal: 0,
          lineShipping: 0,
          changed: true,
          reasons: ["NO_PRICE"],
        });
        continue;
      }

      const unitPrice = Number(fin.discountedPrice || 0);
      const unitShipping = Number(fin.shipping || product.shipping || 0);

      const line: SyncedCartLine = {
        productId,
        style,
        size: sizeLabel,
        requestedQty,
        availableQty,
        qty,
        name: product.name,
        image: sub.images?.[0] || "",
        price: unitPrice,
        shipping: unitShipping,
        lineTotal: Number((unitPrice * qty).toFixed(2)),
        lineShipping: Number((unitShipping * qty).toFixed(2)),
        changed: false,
        reasons: [],
      };

      if (qty !== requestedQty) {
        line.changed = true;
        line.reasons.push(availableQty === 0 ? "OOS" : "QTY_ADJUSTED");
      }

      out.push(line);
    }

    const subtotal = Number(out.reduce((a, l) => a + l.lineTotal, 0).toFixed(2));
    const shipping = Number(out.reduce((a, l) => a + l.lineShipping, 0).toFixed(2));
    const total = Number((subtotal + shipping).toFixed(2));
    const anyChanged = out.some((l) => l.changed);

    /* -------------------- Persist to DB (upsert) -------------------- */
    // Checkout reads from DB; make sure the synced cart is saved for this user.
    // We store per-line *unit* price and qty; cartTotal includes shipping so Checkout matches the UI.
    const dbProducts = out
      .filter((l) => isValidObjectId(l.productId) && l.qty > 0 && l.price > 0)
      .map((l) => ({
        product: new Types.ObjectId(l.productId), // schema uses "product" (parent id)
        style: l.style,
        size: l.size,
        qty: l.qty,
        price: l.price, // unit price snapshot
      }));

    const saved = await Cart.findOneAndUpdate(
      { user: new Types.ObjectId(userIdFromSession) },
      {
        $set: {
          user: new Types.ObjectId(userIdFromSession),
          products: dbProducts,
          cartTotal: total,            // keep in sync with UI "Total"
          totalAfterDiscount: total,   // set same for now (unless coupon logic applies)
        },
      },
      { upsert: true, new: true }
    ).lean();

    console.log("[/api/cart/sync] saved cart", {
      userIdFromSession,
      lineCount: dbProducts.length,
      cartTotal: saved?.cartTotal,
    });

    return NextResponse.json<CartSyncResponse>(
      { lines: out, subtotal, shipping, total, anyChanged, saved: true },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/cart/sync] fatal:", err);
    }
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}