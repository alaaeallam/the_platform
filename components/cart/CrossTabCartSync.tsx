"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { updateCart, type CartState } from "@/store/cartSlice";

/** Rehydrates cart when another tab writes to redux-persist. */
export default function CrossTabCartSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "persist:root") return;
      try {
        const root = JSON.parse(e.newValue || "{}");
        // redux-persist stores each slice as a JSON string
        const cartSliceRaw = root.cart;
        const cartSlice: CartState | undefined = cartSliceRaw
          ? JSON.parse(cartSliceRaw)
          : undefined;

        if (cartSlice?.cartItems) {
          dispatch(updateCart(cartSlice.cartItems));
        }
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  return null;
}