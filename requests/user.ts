// requests/user.ts
import axios from "axios";

export type IncomingCartItem = {
  productId: string;
  style: number;
  size: string;
  qty: number;
  color?: { image?: string; color?: string };
};

export type CartPayload = {
  cart: IncomingCartItem[];
  country?: string;
  countryGroups?: Record<string, string[]>;
};

export async function saveCart(payload: CartPayload) {
  const { data } = await axios.post("/api/user/saveCart", payload);
  return data;
}