// app/profile/payment/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Layout from "@/components/profile/layout";
import User from "@/models/User";
import { connectDb } from "@/utils/db";
import styles from "@/app/styles/profile.module.scss";
import PaymentClient from "@/components/profile/payment/paymentClient";
import type { PaymentMethod } from "@/types/checkout";

function getUserId(user: unknown): string | null {
  if (typeof user === "object" && user !== null && "id" in user) {
    const id = (user as { id: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Payment Methods",
};

type PageProps = {
  // Next 15: searchParams is a Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/profile/payment");

  const sp = await searchParams;
  const tabParam = sp?.tab;
  const tab =
    typeof tabParam === "string"
      ? Number(tabParam) || 0
      : Array.isArray(tabParam)
      ? Number(tabParam[0]) || 0
      : 0;

  await connectDb();
  const userId = getUserId(session.user);
  if (!userId) redirect("/signin?callbackUrl=/profile/payment");

  const doc = await User.findById(userId)
    .select("defaultPaymentMethod")
    .lean();

  const rawPM: unknown = (doc && typeof doc === "object" && "defaultPaymentMethod" in doc)
    ? (doc as { defaultPaymentMethod?: unknown }).defaultPaymentMethod
    : undefined;
  const defaultPaymentMethod: PaymentMethod =
    rawPM === "paypal" || rawPM === "credit_card" || rawPM === "cod"
      ? (rawPM as PaymentMethod)
      : "paypal";

  return (
    <Layout user={session.user} tab={tab}>
      <div className={styles.header}>
        <h1>MY PAYMENT METHODS</h1>
      </div>
      <PaymentClient defaultPaymentMethod={defaultPaymentMethod} />
    </Layout>
  );
}
