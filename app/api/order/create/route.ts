// app/api/order/create/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose, { Types } from "mongoose";

import { calculateDelivery } from "@/lib/delivery/calculateDelivery";
import { authOptions } from "@/lib/auth";
import db from "@/utils/db";
import User from "@/models/User";
import Order, {
  type IOrderCreate,
  type IOrderProduct,
  type IShippingAddress,
} from "@/models/Order";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-09-30.clover",
});

/* ----------------------------- Types ----------------------------- */

type Body = {
  products?: Array<{
    product?: string;
    name?: string;
    image?: string;
    size?: string | number;
    qty?: number;
    color?: { color?: string; image?: string };
    price?: number;
  }>;
  shippingAddress?: Partial<IShippingAddress>;
  paymentMethod?: string;
  payment?: { provider: "stripe"; intentId: string } | undefined;
  total?: number; // ignored (client-provided)
  totalBeforeDiscount?: number; // ignored (client-provided)
  couponApplied?: string;
  country?: string;
};

type Ok = { order_id: string };
type Err = { message: string };


type CartLine = {
  product: unknown;
  name?: string;
  image?: string;
  size?: string | number;
  qty: number;
  color?: { color?: string; image?: string };
  price: number;
};

interface LeanProduct {
  _id: string;
  name?: string;
  images?: Array<string | { url: string }>;
  subProducts?: Array<{
    images?: string[];
    color?: { color?: string; image?: string };
    sizes?: Array<{ size?: string; qty?: number }>;
    sold?: number;
  }>;
  color?: { image?: string };
}

/* ----------------------------- Helpers ----------------------------- */

const toMoney = (n: number) => Math.round(n * 100) / 100;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Server error");

function normalizeCouponCode(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length ? normalized : null;
}

function isValidAddress(a?: Partial<IShippingAddress>): a is IShippingAddress {
  if (!a) return false;
  const required: (keyof IShippingAddress)[] = [
    "firstName",
    "lastName",
    "phoneNumber",
    "address1",
    "city",
    "state",
    "zipCode",
    "country",
    "countryCode",
  ];
  return required.every(
    (k) => typeof a[k] === "string" && String(a[k]).trim().length > 0
  );
}

async function hydrateLine(line: CartLine): Promise<CartLine> {
  if (line.name && line.image) return line;

  const prodId = line.product ? String(line.product) : undefined;
  if (!prodId) return line;

  const doc = await Product.findById(prodId)
    .select("name images subProducts color")
    .lean<LeanProduct | null>()
    .exec();

  const imgFromSub = doc?.subProducts?.[0]?.images?.[0];
  const imgFromImagesArr = (() => {
    const first = doc?.images?.[0];
    if (!first) return undefined;
    return typeof first === "string" ? first : first.url;
  })();
  const imgFromColor = doc?.color?.image;

  const firstImage =
    line.image ??
    imgFromSub ??
    imgFromImagesArr ??
    imgFromColor ??
    "";

  const name = line.name ?? (doc?.name ?? "Product");

  return { ...line, name, image: firstImage || "" };
}

function normalizeText(value?: string | number | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function scoreSubProductMatch(
  sub: {
    color?: { color?: string; image?: string };
    sizes?: Array<{ size?: string; qty?: number }>;
  },
  line: Pick<IOrderProduct, "size" | "color">
): number {
  let score = 0;

  const wantedColorImage = normalizeText(line.color?.image);
  const wantedColorName = normalizeText(line.color?.color);
  const wantedSize = normalizeText(line.size);

  const subColorImage = normalizeText(sub.color?.image);
  const subColorName = normalizeText(sub.color?.color);

  if (wantedColorImage && subColorImage && wantedColorImage === subColorImage) {
    score += 5;
  }

  if (wantedColorName && subColorName && wantedColorName === subColorName) {
    score += 3;
  }

  if (
    wantedSize &&
    Array.isArray(sub.sizes) &&
    sub.sizes.some((size) => normalizeText(size.size) === wantedSize)
  ) {
    score += 2;
  }

  return score;
}

function findMatchingSubProductIndex(
  subProducts: Array<{
    color?: { color?: string; image?: string };
    sizes?: Array<{ size?: string; qty?: number }>;
  }>,
  line: Pick<IOrderProduct, "size" | "color">
): number {
  if (!subProducts.length) return -1;

  let bestIndex = 0;
  let bestScore = -1;

  subProducts.forEach((sub, index) => {
    const score = scoreSubProductMatch(sub, line);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

async function syncInventoryFromOrderLines(lines: IOrderProduct[]): Promise<void> {
  for (const line of lines) {
    const productId = String(line.product);
    if (!mongoose.Types.ObjectId.isValid(productId)) continue;

    const productDoc = await Product.findById(productId);
    if (!productDoc || !Array.isArray(productDoc.subProducts) || !productDoc.subProducts.length) {
      continue;
    }

    const subIndex = findMatchingSubProductIndex(productDoc.subProducts, line);
    if (subIndex < 0) continue;

    const subProduct = productDoc.subProducts[subIndex];
    const wantedSize = normalizeText(line.size);

    let sizeIndex = Array.isArray(subProduct.sizes)
      ? subProduct.sizes.findIndex((size) => normalizeText(size.size) === wantedSize)
      : -1;

    if (sizeIndex < 0 && Array.isArray(subProduct.sizes) && subProduct.sizes.length === 1) {
      sizeIndex = 0;
    }

    if (sizeIndex >= 0 && subProduct.sizes[sizeIndex]) {
      const currentQty = Number(subProduct.sizes[sizeIndex].qty || 0);
      const orderedQty = Number(line.qty || 0);
      subProduct.sizes[sizeIndex].qty = Math.max(0, currentQty - orderedQty);
    }

    subProduct.sold = Number(subProduct.sold || 0) + Number(line.qty || 0);

    productDoc.markModified("subProducts");
    await productDoc.save();
  }
}

/* ------------------------------- POST ------------------------------ */

export async function POST(req: Request) {
  let connected = false;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<Err>({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const country = String(body.country || "US").toUpperCase();

    if (!body.paymentMethod) {
      return NextResponse.json<Err>(
        { message: "Payment method is required." },
        { status: 400 }
      );
    }
    if (!isValidAddress(body.shippingAddress)) {
      return NextResponse.json<Err>(
        { message: "Shipping address is incomplete." },
        { status: 400 }
      );
    }

    const shippingAddressCountryCode = String(body.shippingAddress.countryCode || "")
      .trim()
      .toUpperCase();

    const normalizedPaymentMethod = String(body.paymentMethod || "")
      .trim()
      .toLowerCase();

    const isCodPayment = normalizedPaymentMethod === "cash" || normalizedPaymentMethod === "cod";

    if (isCodPayment && shippingAddressCountryCode !== "EG") {
      return NextResponse.json<Err>(
        { message: "Cash on delivery is available only for deliveries in Egypt." },
        { status: 400 }
      );
    }

    await db.connectDb();
    connected = true;

    // Resolve user by email (OAuth) or id
    const u = session.user as { id?: string; email?: string | null };
    const user =
      (u.email ? await User.findOne({ email: u.email }) : null) ??
      (u.id ? await User.findById(u.id) : null);

    if (!user?._id) {
      return NextResponse.json<Err>({ message: "User not found." }, { status: 404 });
    }
    const userId = new Types.ObjectId(String(user._id));

    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json<Err>({ message: "No products provided." }, { status: 400 });
    }

    const subtotal = body.products.reduce(
      (acc, p) => acc + Number(p.price || 0) * Number(p.qty || 0),
      0
    );
    const subtotalRounded = toMoney(subtotal);
    const effectiveTotal = subtotalRounded;

    const deliveryCountryCode = country;

    let delivery: Awaited<ReturnType<typeof calculateDelivery>>;

    try {
      delivery = await calculateDelivery({
        countryCode: deliveryCountryCode,
        subtotal: effectiveTotal,
      });
    } catch {
      return NextResponse.json<Err>(
        { message: "Delivery is not available for the selected country." },
        { status: 400 }
      );
    }

    // Map cart lines to order lines
    const hydrated = await Promise.all((body.products as CartLine[]).map(hydrateLine));

    // Validate that each line now has required denormalized fields
    for (let i = 0; i < hydrated.length; i++) {
      const l = hydrated[i];
      if (!l.name || !l.image) {
        return NextResponse.json<Err>(
          { message: `Order validation failed: products.${i}.name/image missing after hydration` },
          { status: 400 }
        );
      }
    }

    const orderProducts: IOrderProduct[] = hydrated.map((p) => ({
      product: new Types.ObjectId(String(p.product)),
      name: p.name!,
      image: p.image!,
      size: p.size != null ? String(p.size) : undefined,
      qty: Number(p.qty || 0),
      color: p.color ? { color: p.color.color, image: p.color.image } : undefined,
      price: Number(p.price || 0),
    }));

    // Normalize client method ids to canonical values
    const canonicalPaymentMethod = (() => {
      const pm = (body.paymentMethod || "").toLowerCase();
      if (pm === "paypal") return "paypal";
      if (pm === "cash" || pm === "cod") return "cash";
      // treat card brands / stripe as stripe
      if (pm === "stripe" || pm === "visa" || pm === "mastercard") return "stripe";
      return pm || "cash"; // default
    })();

    const payload: IOrderCreate = {
      user: userId,
      products: orderProducts,
      shippingAddress: {
        firstName: body.shippingAddress.firstName!,
        lastName: body.shippingAddress.lastName!,
        phoneNumber: body.shippingAddress.phoneNumber!,
        address1: body.shippingAddress.address1!,
        address2: body.shippingAddress.address2 ?? "",
        city: body.shippingAddress.city!,
        state: body.shippingAddress.state!,
        zipCode: body.shippingAddress.zipCode!,
        country: body.shippingAddress.country!,
        countryCode: deliveryCountryCode,
      },
      paymentMethod: canonicalPaymentMethod,
      total: toMoney(effectiveTotal + delivery.fee),
      totalBeforeDiscount: subtotalRounded,
      couponApplied: normalizeCouponCode(body.couponApplied) ?? undefined,
      shippingPrice: delivery.fee,
      delivery,
      taxPrice: 0,
      isPaid: false,
      status: "Not Processed",
      paymentResult: undefined,
      paidAt: undefined,
      deliveredAt: undefined,
    };

    // If Stripe payment info is provided, verify the intent and mark as paid
    if (body.payment?.provider === "stripe" && body.payment.intentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(body.payment.intentId, {
          expand: ["latest_charge"],
        });
        if (pi.status === "succeeded") {
          // Optional integrity checks
          // if (pi.amount !== Math.round(effectiveTotal * 100)) {
          //   return NextResponse.json<Err>({ message: "Payment amount mismatch." }, { status: 400 });
          // }
          const latestCharge = (pi.latest_charge ?? null) as Stripe.Charge | string | null;
          const receiptUrl =
            typeof latestCharge === "object" && latestCharge !== null
              ? latestCharge.receipt_url ?? undefined
              : undefined;

          payload.isPaid = true;
          payload.paidAt = new Date();
          payload.paymentMethod = "stripe";
          payload.paymentResult = {
            id: pi.id,
            status: pi.status,
            amount: pi.amount,
            currency: pi.currency,
            receipt_url: receiptUrl,
          } as {
            id: string;
            status: string;
            amount: number;
            currency: string;
            receipt_url?: string;
          };
          payload.status = "Not Processed";
        } else {
          return NextResponse.json<Err>({ message: "Payment not completed." }, { status: 400 });
        }
      } catch (e) {
        return NextResponse.json<Err>(
          { message: `Unable to verify payment: ${errMsg(e)}` },
          { status: 400 }
        );
      }
    }

    if (payload.couponApplied) {
      const now = new Date();

      const couponUpdate = await Coupon.findOneAndUpdate(
        {
          coupon: payload.couponApplied,
          isActive: true,
          $and: [
            {
              $or: [
                { startDate: { $exists: false } },
                { startDate: null },
                { startDate: { $lte: now } },
              ],
            },
            {
              $or: [
                { endDate: { $exists: false } },
                { endDate: null },
                { endDate: { $gte: now } },
              ],
            },
            {
              $or: [
                { usageLimit: { $exists: false } },
                { usageLimit: null },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
              ],
            },
          ],
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (!couponUpdate) {
        return NextResponse.json<Err>(
          { message: "Coupon is no longer available. Please remove it and try again." },
          { status: 400 }
        );
      }
    }

    const created = await Order.create(payload);

    await syncInventoryFromOrderLines(orderProducts);


    return NextResponse.json<Ok>({ order_id: String(created._id) }, { status: 200 });
  } catch (e) {
    return NextResponse.json<Err>({ message: errMsg(e) }, { status: 500 });
  } finally {
    if (connected) {
      try {
        await db.disconnectDb();
      } catch {
        /* ignore */
      }
    }
  }
}