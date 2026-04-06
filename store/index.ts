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
import expandReducer from "./ExpandSlice";
import wishlistReducer from "./wishlistSlice";

function createNoopStorage(): WebStorage {
  return {
    getItem: async (_key: string) => null,
    setItem: async (_key: string, _value: string) => {},
    removeItem: async (_key: string) => {},
  };
}

const storage: WebStorage =
  typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

const rootReducer = combineReducers({
  cart: cartReducer,
  dialog: dialogReducer,
  expandSidebar: expandReducer,
  wishlist: wishlistReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootReducerState> = {
  key: "root",
  storage,
  whitelist: ["cart", "wishlist"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const makePersistor = () => persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;