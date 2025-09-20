// types/cart.ts
export interface CartProduct {
  _uid: string;

  // core cart fields
  name: string;
  qty: number;          // quantity in cart
  quantity: number;     // stock available
  price: number;
  shipping?: number | string;

  // optional UI fields
  priceBefore?: number;
  discount?: number;
  size?: string;
  images: { url: string }[];
  color: { image: string };

  // allow extras
  [key: string]: unknown;
}