// requests/cart.ts
export type ClientCartLine = {
  productId: string;
  style: number;
  size: string;
  qty: number;
  _uid?: string;
};

export type CartSyncBody = {
  cart: ClientCartLine[];
  country?: string; // ISO2
  countryGroups?: Record<string, string[]>;
};

export type SyncedCartLine = {
  productId: string;
  style: number;
  size: string;
  requestedQty: number;
  availableQty: number;
  qty: number;
  name: string;
  image: string;
  price: number;
  shipping: number;
  lineTotal: number;
  lineShipping: number;
  changed: boolean;
  reasons: Array<"MISSING" | "OOS" | "QTY_ADJUSTED" | "PRICE_CHANGED" | "STRUCTURE_FIXED">;
};

export type CartSyncResponse = {
  lines: SyncedCartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  anyChanged: boolean;
};

export async function syncCart(payload: CartSyncBody): Promise<CartSyncResponse> {
  const res = await fetch("/api/cart/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
  return res.json();
}