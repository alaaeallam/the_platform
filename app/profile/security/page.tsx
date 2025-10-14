// app/profile/security/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Layout from "@/components/profile/layout";
import styles from "@/app/styles/profile.module.scss";
import SecurityClient from "@/components/profile/security/SecurityClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecurityPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/profile/security");

  const sp = await searchParams;
  const tabParam = sp?.tab;
  const tab =
    typeof tabParam === "string"
      ? Number(tabParam) || 0
      : Array.isArray(tabParam)
      ? Number(tabParam[0]) || 0
      : 0;

  return (
    <Layout user={session.user} tab={tab}>
      <div className={styles.header}>
        <h1>Profile - Security</h1>
      </div>
      <SecurityClient />
    </Layout>
  );
}
