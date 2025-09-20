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

/** --------- SSR-safe storage --------- */
function createNoopStorage(): WebStorage {
  return {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
}
const storage: WebStorage =
  typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

/** --------- Root reducer --------- */
const rootReducer = combineReducers({
  cart: cartReducer,
  dialog: dialogReducer,
});
export type RootReducerState = ReturnType<typeof rootReducer>;

/** --------- Persist only specific slices --------- */
const persistConfig: PersistConfig<RootReducerState> = {
  key: "root",
  storage,
  whitelist: ["cart"], // persist only the cart slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/** --------- Store --------- */
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: {
        // Ignore redux-persist action types instead of turning the check off
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

/** --------- Persistor --------- */
export const persistor = persistStore(store);

/** --------- Types --------- */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** --------- Typed hooks (optional but recommended) --------- */
// You can import these instead of raw `useDispatch` / `useSelector`
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;