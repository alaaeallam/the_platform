// store/DialogSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DialogMsg = { msg: string; type: "error" | "success" };

export interface DialogLink {
  link: string;
  link_text: string;
}

export interface DialogState {
  show: boolean;
  header: string;
  msgs: DialogMsg[];
  link?: DialogLink;
}

const initialState: DialogState = {
  show: false,
  header: "",
  msgs: [],
  link: undefined,
};

const dialogSlice = createSlice({
  name: "dialog",
  initialState,
  reducers: {
    showDialog(
      state,
      action: PayloadAction<{ header: string; msgs: DialogMsg[]; link?: DialogLink }>
    ) {
      state.show = true;
      state.header = action.payload.header;
      state.msgs = action.payload.msgs;
      state.link = action.payload.link;
    },
    hideDialog(state) {
      state.show = false;
      state.header = "";
      state.msgs = [];
      state.link = undefined;
    },
  },
});

export const { showDialog, hideDialog } = dialogSlice.actions;
export default dialogSlice.reducer;