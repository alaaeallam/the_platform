// app/profile/address/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Layout from "@/components/profile/layout";
import { connectDb } from "@/utils/db";
import User from "@/models/User";
import styles from "@/app/styles/profile.module.scss";
import AddressClient from "@/components/profile/address/AddressClient";
import type { Address } from "@/types/checkout";

function getUserId(u: unknown): string | null {
  if (typeof u === "object" && u !== null && "id" in u) {
    const id = (u as { id: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Addresses",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AddressPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/profile/address");

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
  if (!userId) {
    redirect("/signin?callbackUrl=/profile/address");
  }

  const doc = await User.findById(userId)
    .select("_id address")
    .lean();

  const rawAddressesUnknown: unknown =
    doc && typeof doc === "object" && "address" in doc
      ? (doc as { address?: unknown }).address
      : undefined;
  const rawArray: unknown[] = Array.isArray(rawAddressesUnknown) ? rawAddressesUnknown : [];

  const initialAddresses: Address[] = rawArray.map((item) => {
    const a = (item ?? {}) as Record<string, unknown>;
    return {
      firstName: typeof a.firstName === "string" ? a.firstName : "",
      lastName: typeof a.lastName === "string" ? a.lastName : "",
      phoneNumber: typeof a.phoneNumber === "string" ? a.phoneNumber : "",
      state: typeof a.state === "string" ? a.state : "",
      city: typeof a.city === "string" ? a.city : "",
      zipCode: typeof a.zipCode === "string" ? a.zipCode : "",
      address1: typeof a.address1 === "string" ? a.address1 : "",
      address2: typeof a.address2 === "string" ? a.address2 : "",
      country: typeof a.country === "string" ? a.country : "",
      active: typeof a.active === "boolean" ? a.active : false,
    } as Address;
  });

  return (
    <Layout user={session.user} tab={tab}>
      <div className={styles.header}>
        <h1>MY ADDRESSES</h1>
      </div>
      <AddressClient user={session.user} initialAddresses={initialAddresses} />
    </Layout>
  );
}