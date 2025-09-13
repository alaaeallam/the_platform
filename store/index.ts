// store/index.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  type PersistConfig,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import type { WebStorage } from "redux-persist/es/types";

import cartReducer from "./cartSlice";
import dialogReducer from "./DialogSlice";

/** No-op storage for SSR (mirrors WebStorage shape) */
function createNoopStorage(): WebStorage {
  return {
    getItem(_key: string): Promise<string | null> {
      return Promise.resolve(null);
    },
    setItem(_key: string, _value: string): Promise<void> {
      return Promise.resolve();
    },
    removeItem(_key: string): Promise<void> {
      return Promise.resolve();
    },
  };
}

const storage: WebStorage =
  typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

/** Root reducer */
const rootReducer = combineReducers({
  cart: cartReducer,
  dialog: dialogReducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;

/** Persist only the cart slice */
const persistConfig: PersistConfig<RootReducerState> = {
  key: "root",
  storage,
  whitelist: ["cart"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/** Store */
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist actions include non-serializable payloads
      immutableCheck: false,
    }),
});

/** Persistor */
export const persistor = persistStore(store);

/** Types */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;