export interface CartProduct {
  _uid: string;

  // core cart fields
  name: string;
  qty: number;          // chosen quantity in cart
  quantity: number;     // available stock
  price: number;
  shipping?: number | string;

  // optional UI fields used by components
  priceBefore?: number;
  discount?: number;
  size?: string;
  images: { url: string }[];
  color: { image: string };

  // allow extra fields without breaking typing
  [key: string]: unknown;
}