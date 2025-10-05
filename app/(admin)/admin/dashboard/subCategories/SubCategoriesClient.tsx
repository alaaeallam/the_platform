"use client";

import * as React from "react";
import Create from "@/components/admin/subCategories/Create";
import List from "@/components/admin/subCategories/List";
import type { CategoryVM, SubCategoryVM, SubCategoryServer } from "@/components/admin/subCategories/types";
import { toClient } from "@/components/admin/subCategories/types";
import Layout from "@/components/admin/layout";

interface Props {
  categories: CategoryVM[];
  initialSubCategories: SubCategoryServer[];
}

export default function SubCategoriesClient({
  categories,
  initialSubCategories,
}: Props): React.JSX.Element {
  const [subCategories, setSubCategories] = React.useState<SubCategoryVM[]>(
    () => initialSubCategories.map(toClient)
  );

  return (
    <div>
      <Create categories={categories} setSubCategories={setSubCategories} />
      <List
        categories={categories}
        subCategories={subCategories}
        setSubCategories={setSubCategories}
      />
    </div>
  
  );
}