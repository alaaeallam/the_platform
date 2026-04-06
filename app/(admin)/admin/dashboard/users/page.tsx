import Layout from "@/components/admin/layout";
import { connectDb } from "@/utils/db";
import User from "@/models/User";
import type { UserRow } from "@/types/users";
import dynamic from "next/dynamic";

const EnhancedTable = dynamic(() => import("@/components/admin/users/table"));

type LeanUser = {
  _id: unknown;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

/**
 * Server component – runs on the server in the App Router.
 * Fetches users, normalizes them to serializable props, and renders the table.
 */
export default async function UsersPage() {
  await connectDb();

  const users = await User.find({})
    .select("_id name email image role createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean<LeanUser[]>();

  // Ensure plain, serializable values
  const rows: UserRow[] = (users ?? []).map((u: LeanUser) => ({
    _id: String(u._id),
    name: u.name ?? "",
    email: u.email ?? "",
    image: u.image ?? "",
    role: u.role ?? "",
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
    updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : undefined,
  }));

  return (
    <Layout>
      {/* EnhancedTable should be a Client Component if it uses hooks/state */}
      <EnhancedTable rows={rows} />
    </Layout>
  );
}