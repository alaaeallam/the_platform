// app/(admin)/admin/dashboard/categories/CategoriesClient.tsx
"use client";

import { useState } from "react";
import Create from "@/components/admin/categories/Create";
import List from "@/components/admin/categories/List";
import type { CategoryVM } from "@/components/admin/categories/types";

// Duplicate or import the shared type.
// If you keep the source of truth in a single file (recommended),
// move CategoryVM into "@/types/category.ts" and import it from there.

interface CategoriesClientProps {
  initialCategories: CategoryVM[];
}

export default function CategoriesClient({
  initialCategories,
}: CategoriesClientProps) {
  const [categories, setCategories] = useState<CategoryVM[]>(initialCategories);

  return (
   
    <div>
      <Create setCategories={setCategories} />
      <List categories={categories} setCategories={setCategories} />
    </div>

  );
}
