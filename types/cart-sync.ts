// types/cart-sync.ts

export type ClientCartLine = {
  productId?: string;
  style?: number;                     // subProduct index
  size: string;
  qty: number;
  color?: { color?: string; image?: string };
  _uid?: string;                      // legacy support
};

export type CartSyncBody = {
  cart: ClientCartLine[];
  country?: string;                   // ISO2 e.g. "US"
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
  price: number;                      // unit (discounted, excl. shipping)
  shipping: number;                   // unit
  lineTotal: number;                  // qty * price
  lineShipping: number;               // qty * shipping

  changed: boolean;
  reasons: Array<
    | "MISSING"
    | "OOS"
    | "QTY_ADJUSTED"
    | "PRICE_CHANGED"
    | "STRUCTURE_FIXED"
  >;
};

export type CartSyncResponse = {
  lines: SyncedCartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  anyChanged: boolean;
};