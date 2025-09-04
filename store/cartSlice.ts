// src/features/cart/cartSlice.ts
import { createSlice } from "@reduxjs/toolkit";

type Item = { id: string; title: string; price: number; qty: number };
type CartState = { items: Item[]; coupon?: string | null };

const initialState: CartState = { items: [], coupon: null };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
 
  },
});

// export const {  } = cartSlice.actions;
export default cartSlice.reducer;