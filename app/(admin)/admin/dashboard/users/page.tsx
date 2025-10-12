import Layout from "@/components/admin/layout";
import EnhancedTable from "@/components/admin/users/table";
import { connectDb } from "@/utils/db";
import User from "@/models/User";
import type { UserRow } from "@/types/users";

/**
 * Server component – runs on the server in the App Router.
 * Fetches users, normalizes them to serializable props, and renders the table.
 */
export default async function UsersPage() {
  await connectDb();

  const users = await User.find({})
    .sort({ createdAt: -1 })
    .lean()
    .exec();

type LeanUser = {
  _id: unknown;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

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