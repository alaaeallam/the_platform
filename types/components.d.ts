// types/components.d.ts
import type { AdminOrderVM } from "@/app/(admin)/admin/orders/page";

declare module "@/components/admin/orders/table" {
  interface CollapsibleTableProps {
    rows: AdminOrderVM[];
  }
  const CollapsibleTable: (props: CollapsibleTableProps) => JSX.Element;
  export default CollapsibleTable;
}