// utils/wishlist.ts
export type WishIdentity = {
  productId: string;
  subProductId?: string;
  size?: string;
  color?: string; // color name or hex
};

export function makeWishKey(id: WishIdentity) {
  return [
    id.productId,
    id.subProductId ?? "-",
    id.size ?? "-",
    id.color ?? "-",
  ].join("|");
}
