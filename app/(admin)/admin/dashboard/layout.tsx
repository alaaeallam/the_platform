import AdminLayout from "@/components/admin/layout";
import AppProviders from "@/components/providers/AppProviders";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <AdminLayout>{children}</AdminLayout>
    </AppProviders>
  )
}