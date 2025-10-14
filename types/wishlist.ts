// types/wishlist.ts
export interface WishItem {
  key: string;                // makeWishKey(...)
  productId: string;
  slug: string;
  name: string;
  image: string;              // primary image url
  priceSnapshot?: number;     // store-at-add time price (optional)
  subProductId?: string;
  size?: string;
  color?: string;
  addedAt: string;            // ISO
}

export interface WishlistVM {
  items: WishItem[];
}