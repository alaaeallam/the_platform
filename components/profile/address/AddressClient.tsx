// components/profile/address/AddressClient.tsx
"use client";

import { JSX, useMemo, useState } from "react";
import type { Session } from "next-auth";
import Shipping from "@/components/checkout/shipping";
import type { Address } from "@/types/checkout";

interface AddressClientProps {
  /** NextAuth session user (id, name, email, image, etc.) */
  user: Session["user"];
  /** Initial addresses fetched on the server from User.address */
  initialAddresses: Address[];
}

export default function AddressClient({
  user,
  initialAddresses,
}: AddressClientProps): JSX.Element {
  const [addresses, setAddresses] = useState<Address[]>(
    Array.isArray(initialAddresses) ? initialAddresses : []
  );

  /**
   * Shape expected by <Shipping /> in this codebase:
   *   user.address -> Address[]
   * Keep it minimal and derived from current state.
   */
  const userForShipping = useMemo(
    () => ({ user, address: addresses }),
    [user, addresses]
  );

  return (
    <Shipping
      user={userForShipping as unknown as object} // legacy shape expected by Shipping
      addresses={addresses}
      setAddresses={setAddresses}
      profile
    />
  );
}