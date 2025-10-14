// app/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Layout from "@/components/profile/layout";

// Always fetch fresh session for this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Use Metadata API instead of next/head
export const metadata = {
  title: "Profile",
};

type PageProps = {
  // Next 15: searchParams is a Promise and must be awaited
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/profile");

  const sp = await searchParams;
  const tabParam = sp?.tab;

  const tab =
    typeof tabParam === "string"
      ? Number.isFinite(Number(tabParam))
        ? Number(tabParam)
        : 0
      : Array.isArray(tabParam)
      ? Number(tabParam[0]) || 0
      : 0;

  return <Layout user={session.user} tab={tab} />;
}