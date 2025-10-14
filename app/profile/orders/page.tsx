// app/profile/orders/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/profile/layout";
import { ordersLinks } from "@/data/profile";
import Order from "@/models/Order";
import { connectDb } from "@/utils/db";
import styles from "@/app/styles/profile.module.scss";
import { FiExternalLink } from "react-icons/fi";
import slugify from "slugify";

// --- Lean shapes from Mongo used only for local mapping ---
interface OrderProductLean {
  _id?: unknown;
  image?: unknown;
}
interface OrderLean {
  _id?: unknown;
  products?: unknown;
  paymentMethod?: unknown;
  total?: unknown;
  isPaid?: unknown;
  status?: unknown;
}
function getUserId(u: unknown): string | null {
  if (typeof u === "object" && u !== null && "id" in u) {
    const id = (u as { id: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Orders",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PaymentMethod = "paypal" | "credit_card" | "COD" | "cod" | string;

interface OrderProductVM {
  _id: string;
  image: string;
}

interface OrderVM {
  _id: string;
  products: OrderProductVM[];
  paymentMethod: PaymentMethod;
  total: number;
  isPaid: boolean;
  status: string;
}

interface PageProps {
  searchParams: SearchParams;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/profile/orders");

  const sp = await searchParams;
  const tabParam = sp?.tab;
  const qParam = (sp?.q as string | undefined) ?? "";

  const tab =
    typeof tabParam === "string"
      ? Number(tabParam) || 0
      : Array.isArray(tabParam)
      ? Number(tabParam[0]) || 0
      : 0;

  const filter = qParam.split("__")[1] ?? "";

  await connectDb();

  const normalizePaymentMethod = (value: unknown): PaymentMethod => {
    const s = String(value ?? "").toLowerCase().trim();
    if (s.includes("paypal")) return "paypal";
    if (s.includes("credit") || s.includes("card") || s.includes("stripe") || s.includes("visa") || s.includes("master")) {
      return "credit_card";
    }
    if (s.includes("cod") || s.includes("cash") || s.includes("delivery")) {
      return "cod";
    }
    return s;
  };

  const paymentLabel = (pm: PaymentMethod): string => {
    if (pm === "paypal") return "Paypal";
    if (pm === "credit_card") return "Credit Card";
    if (pm === "cod" || pm === "COD") return "COD";
    // fallback to whatever string we received
    return String(pm);
  };

  // Normalize Mongoose lean docs -> OrderVM (string ids etc.)
  const normalizeOrders = (docs: unknown[]): OrderVM[] =>
    (Array.isArray(docs) ? docs : []).map((d): OrderVM => {
      const doc = d as OrderLean;
      const productsRaw: unknown = doc?.products;
      const productsArr: OrderProductLean[] = Array.isArray(productsRaw) ? (productsRaw as OrderProductLean[]) : [];
      return {
        _id: String(doc?._id ?? ""),
        products: productsArr.map((p) => ({
          _id: String(p?._id ?? ""),
          image: String(p?.image ?? ""),
        })),
        paymentMethod: normalizePaymentMethod(doc?.paymentMethod),
        total: Number(doc?.total ?? 0),
        isPaid: Boolean(doc?.isPaid),
        status: String(doc?.status ?? ""),
      };
    });

  const userId = getUserId(session.user);
  if (!userId) redirect("/signin?callbackUrl=/profile/orders");
  let rawOrders: OrderLean[] = [];
  if (!filter) {
    rawOrders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  } else if (filter === "paid") {
    rawOrders = await Order.find({ user: userId, isPaid: true }).sort({ createdAt: -1 }).lean();
  } else if (filter === "unpaid") {
    rawOrders = await Order.find({ user: userId, isPaid: false }).sort({ createdAt: -1 }).lean();
  } else {
    rawOrders = await Order.find({ user: userId, status: filter }).sort({ createdAt: -1 }).lean();
  }
  const orders: OrderVM[] = normalizeOrders(rawOrders);

  const activeSlugLeft = (qParam.split("__")[0] ?? "").toLowerCase();

  return (
    <Layout user={session.user} tab={tab}>
      <div className={styles.orders}>
        <div className={styles.header}>
          <h1>MY ORDERS</h1>
        </div>

        <nav>
          <ul>
            {ordersLinks.map((link: { name: string; filter?: string }, i: number) => {
              const slug = slugify(link.name, { lower: true });
              const href = `/profile/orders?tab=${tab}&q=${slug}__${link.filter ?? ""}`;
              const isActive = slug === activeSlugLeft;
              return (
                <li key={i} className={isActive ? styles.active : ""}>
                  <Link href={href}>{link.name}</Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <table>
          <thead>
            <tr>
              <td>Order id</td>
              <td>Products</td>
              <td>Payment Method</td>
              <td>Total</td>
              <td>Paid</td>
              <td>Status</td>
              <td>View</td>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td className={styles.orders__images}>
                  {order.products?.map((p, i) => {
                    const k = `${order._id}-${i}-${p?._id ?? "noid"}`;
                    const src = p.image || "/images/placeholder.png";
                    return (
                      <Image
                        key={k}
                        src={src}
                        alt={`Product ${i + 1}`}
                        width={48}
                        height={48}
                        sizes="48px"
                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }}
                        priority={false}
                      />
                    );
                  })}
                </td>
                <td>
                  {paymentLabel(order.paymentMethod)}
                </td>
                <td>{order.total}$</td>
                <td className={styles.orders__paid}>
                  {order.isPaid ? (
                    <Image
                      src="/images/verified.png"
                      alt="Paid"
                      width={18}
                      height={18}
                      sizes="18px"
                      style={{ width: 18, height: 18 }}
                    />
                  ) : (
                    <Image
                      src="/images/unverified.png"
                      alt="Unpaid"
                      width={18}
                      height={18}
                      sizes="18px"
                      style={{ width: 18, height: 18 }}
                    />
                  )}
                </td>
                <td>{order.status}</td>
                <td>
                  <Link href={`/order/${order._id}`}>
                    <FiExternalLink />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
