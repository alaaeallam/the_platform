// components/admin/subCategories/types.ts

/** Category as used in admin UI */
export interface CategoryVM {
  _id: string;
  name: string;
  slug?: string;
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Client-normalized: parent is ALWAYS a string id */
export interface SubCategoryVM {
  _id: string;
  name: string;
  slug?: string;
  parent: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Server/DB shape returned from APIs:
 * `parent` may be a string id, a populated object, or null.
 */
export interface SubCategoryServer {
  _id: string;
  name: string;
  slug?: string;
  parent: string | { _id: string; name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Convert a DB/lean doc with possibly-populated parent into a SubCategoryServer */
export function toServerShape(input: {
  _id: unknown;
  name: string;
  slug?: string;
  parent?: string | { _id: unknown; name?: string } | null;
  createdAt?: Date;
  updatedAt?: Date;
}): SubCategoryServer {
  const parent: SubCategoryServer["parent"] =
    typeof input.parent === "string"
      ? input.parent
      : input.parent
      ? { _id: String(input.parent._id), name: input.parent.name ?? "" }
      : null;

  return {
    _id: String(input._id),
    name: input.name,
    slug: input.slug ?? "",
    parent,
    createdAt: input.createdAt?.toISOString(),
    updatedAt: input.updatedAt?.toISOString(),
  };
}

/** Convert SubCategoryServer (union on parent) to the client VM (parent -> string id) */
export function toClient(sub: SubCategoryServer): SubCategoryVM {
  const parentId = typeof sub.parent === "string" ? sub.parent : sub.parent?._id ?? "";
  return {
    _id: sub._id,
    name: sub.name,
    slug: sub.slug,
    parent: parentId,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}