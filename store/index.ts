// store/index.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
  type PersistConfig,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import type { WebStorage } from "redux-persist/es/types";

import cartReducer from "./cartSlice";
import dialogReducer from "./DialogSlice";
import expandReducer from "./ExpandSlice"; // ✅ add your sidebar slice

/* ======================================
   SSR-safe storage for redux-persist
   ====================================== */
function createNoopStorage(): WebStorage {
  return {
    getItem: async (_key: string) => null,
    setItem: async (_key: string, _value: string) => {},
    removeItem: async (_key: string) => {},
  };
}
const storage: WebStorage =
  typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

/* ======================================
   Root reducer
   ====================================== */
const rootReducer = combineReducers({
  cart: cartReducer,
  dialog: dialogReducer,
  expandSidebar: expandReducer, // ✅ not persisted
});
export type RootReducerState = ReturnType<typeof rootReducer>;

/* ======================================
   Persist only specific slices
   ====================================== */
const persistConfig: PersistConfig<RootReducerState> = {
  key: "root",
  storage,
  whitelist: ["cart"], // ✅ persist cart only
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/* ======================================
   Store
   ====================================== */
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: {
        // Ignore redux-persist action types (keeps checks on for your code)
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

/* ======================================
   Persistor
   ====================================== */
export const persistor = persistStore(store);

/* ======================================
   Types
   ====================================== */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/* ======================================
   Typed hooks (recommended)
   ====================================== */
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

/** Use instead of plain useDispatch for correct RTK v2 typing */
export const useAppDispatch: () => AppDispatch = useDispatch;
/** Use instead of plain useSelector for state typing */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;