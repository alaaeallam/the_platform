// store/wishlistSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { WishlistVM, WishItem } from "@/types/wishlist";
import { makeWishKey } from "@/utils/wishlist";

type State = {
  items: WishItem[];
  loading: boolean;
};

const initialState: State = { items: [], loading: false };

// helpers for guest cookie
const COOKIE = "wl";
function readCookie(): WishItem[] {
  if (typeof document === "undefined") return [];
  try {
    const m = document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
    return m ? JSON.parse(decodeURIComponent(m[1])) : [];
  } catch { return []; }
}
function writeCookie(items: WishItem[]) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(items))}; path=/; max-age=${60*60*24*365}`;
}

export const fetchWishlist = createAsyncThunk<WishItem[]>(
  "wishlist/fetch",
  async () => {
    const res = await fetch("/api/wishlist", { cache: "no-store" });
    if (res.ok) {
      const data: WishlistVM = await res.json();
      return data.items;
    }
    // guest fallback
    return readCookie();
  }
);

export const toggleWishlist = createAsyncThunk<
  { key: string; inWishlist: boolean; item: WishItem },
  WishItem
>("wishlist/toggle", async (item) => {
  const body = { ...item };
  const res = await fetch("/api/wishlist/toggle", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const data = await res.json(); // { key, inWishlist }
    return { key: data.key, inWishlist: data.inWishlist, item };
  }

  // guest path (no session): toggle locally
  const key = makeWishKey(item);
  return { key, inWishlist: true, item };
});

const slice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    loadGuest(state) {
      state.items = readCookie();
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchWishlist.pending, (s) => { s.loading = true; });
    b.addCase(fetchWishlist.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; writeCookie(a.payload); });
    b.addCase(fetchWishlist.rejected, (s) => { s.loading = false; s.items = readCookie(); });

    b.addCase(toggleWishlist.fulfilled, (s, a) => {
      const { key, inWishlist, item } = a.payload;
      const exists = s.items.some((i) => i.key === key);
      if (inWishlist && !exists) {
        s.items.unshift(item);
      } else if (!inWishlist && exists) {
        s.items = s.items.filter((i) => i.key !== key);
      } else if (inWishlist && exists) {
        // server said inWishlist=true but we already had it — no-op
      } else {
        // server said inWishlist=false but we didn’t have it — no-op
      }
      writeCookie(s.items);
    });
  },
});

export const { loadGuest } = slice.actions;
export default slice.reducer;