"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type {
  CategoryVM,
  SubCategoryVM,
  SubCategoryServer,
} from "@/components/admin/subCategories/types";
import { toClient } from "@/components/admin/subCategories/types";

interface Props {
  categories: CategoryVM[];
  initialSubCategories: SubCategoryServer[];
}

const Create = dynamic(() => import("@/components/admin/subCategories/Create"));
const List = dynamic(() => import("@/components/admin/subCategories/List"));

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