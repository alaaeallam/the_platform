// store/cartSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartProduct } from "@/types/cart";

/* ---------- State ---------- */

export interface CartState {
  cartItems: CartProduct[]; // canonical field
}

/** Always return a usable array (also migrates legacy `items` if present). */
function ensureItems(state: Partial<CartState> & Record<string, unknown>): CartProduct[] {
  // If already correct:
  if (Array.isArray((state as CartState).cartItems)) return (state as CartState).cartItems;

  // Legacy persisted field from older builds
  const legacy = Array.isArray((state as any).items) ? ((state as any).items as CartProduct[]) : [];

  // Migrate in-place so future reads are correct
  (state as CartState).cartItems = legacy;
  if ("items" in state) delete (state as any).items;

  return (state as CartState).cartItems;
}

const initialState: CartState = { cartItems: [] };

/* ---------- Slice ---------- */

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /** Add a new line; if it exists, increment qty (capped by stock). */
    addToCart: (state, action: PayloadAction<CartProduct>) => {
  const list = ensureItems(state);
  const incoming = action.payload;

  const idx = list.findIndex((i) => i._uid === incoming._uid);
  if (idx === -1) {
    list.push({
      ...incoming,
      qty: Math.max(1, Math.min(incoming.qty, incoming.quantity)),
    });
  } else {
    const prev = list[idx];
    // merge the latest price/discount/shipping/images/etc from incoming
    const merged = {
      ...prev,
      ...incoming,
      // if you prefer to REPLACE qty with incoming.qty, do: qty: Math.max(1, Math.min(incoming.qty, incoming.quantity))
      qty: Math.max(1, Math.min(prev.qty + incoming.qty, incoming.quantity)),
    };
    list[idx] = merged;
  }
},

    /** Replace entire cart array (kept for compatibility). */
    updateCart: (state, action: PayloadAction<CartProduct[] | undefined>) => {
      state.cartItems = Array.isArray(action.payload) ? action.payload : [];
    },

    /** Remove by _uid. */
    removeFromCart: (state, action: PayloadAction<string>) => {
      const list = ensureItems(state);
      state.cartItems = list.filter((i) => i._uid !== action.payload);
    },

    /** Set a specific line qty (bounded between 1 and stock). */
    setItemQty: (state, action: PayloadAction<{ _uid: string; qty: number }>) => {
      const list = ensureItems(state);
      const { _uid, qty } = action.payload;
      const item = list.find((i) => i._uid === _uid);
      if (!item) return;
      item.qty = Math.max(1, Math.min(qty, item.quantity));
    },

    /** Empty the cart. */
    emptyCart: (state) => {
      state.cartItems = [];
    },
  },
});

export const { addToCart, updateCart, removeFromCart, setItemQty, emptyCart } =
  cartSlice.actions;

export default cartSlice.reducer;

/* ---------- Selectors (resilient) ---------- */

type Root = { cart: CartState } | any; // tolerate legacy persisted shape

const getList = (state: Root): CartProduct[] => {
  const slice = state?.cart ?? state; // handle weird root shapes
  if (Array.isArray(slice?.cartItems)) return slice.cartItems as CartProduct[];
  if (Array.isArray(slice?.items)) return slice.items as CartProduct[]; // legacy
  return [];
};

export const selectCartItems = (state: Root) => getList(state);
export const selectCartLineCount = (state: { cart: CartState }) =>
  (state.cart.cartItems ?? []).length;
export const selectCartCount = (state: Root) =>
  getList(state).reduce((acc, i) => acc + (Number(i.qty) || 0), 0);

export const selectCartSubtotal = (state: Root) =>
  getList(state).reduce((acc, i) => acc + Number(i.price) * Number(i.qty || 0), 0);

export const selectCartShipping = (state: Root) =>
  getList(state).reduce((acc, i) => acc + Number(i.shipping ?? 0), 0);

export const selectCartTotal = (state: Root) =>
  selectCartSubtotal(state) + selectCartShipping(state);