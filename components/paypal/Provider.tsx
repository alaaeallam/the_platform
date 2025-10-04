// components/paypal/Provider.tsx
"use client";

import { PayPalScriptProvider, type ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import * as React from "react";

type Props = {
  clientId: string;
  currency?: string; // default USD
  children: React.ReactNode;
};

export default function PaypalProvider({ clientId, currency = "USD", children }: Props) {
  const options: ReactPayPalScriptOptions = { clientId, currency };
  return <PayPalScriptProvider options={options}>{children}</PayPalScriptProvider>;
}