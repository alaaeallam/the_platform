// store/ExpandSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* =========================
   Types
   ========================= */

export interface ExpandSidebarState {
  expandSidebar: boolean;
}

/* =========================
   Initial State
   ========================= */

const initialState: ExpandSidebarState = {
  expandSidebar: true,
};

/* =========================
   Slice
   ========================= */

const expandSlice = createSlice({
  name: "expandSidebar",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.expandSidebar = !state.expandSidebar;
    },
    // Optional: add explicit set action if needed later
    setSidebar(state, action: PayloadAction<boolean>) {
      state.expandSidebar = action.payload;
    },
  },
});

/* =========================
   Exports
   ========================= */

export const { toggleSidebar, setSidebar } = expandSlice.actions;
export default expandSlice.reducer;