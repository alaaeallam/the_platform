// app/api/user/saveAddress/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth"; // adjust if your authOptions lives elsewhere
import db from "@/utils/db";       // keeping your old utils pathing style
import User from "@/models/User";      // adjust if your models live elsewhere

/* ----------------------------- Types ----------------------------- */

type Address = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  state: string;
  city: string;
  zipCode: string;
  address1: string;
  address2?: string;
  country: string;
  active?: boolean;
};

type Body = {
  address: Address;
  userId?: string; // optional; we prefer session
};

function isValidAddress(a: Partial<Address>): a is Address {
  const reqd: (keyof Address)[] = [
    "firstName",
    "lastName",
    "phoneNumber",
    "state",
    "city",
    "zipCode",
    "address1",
    "country",
  ];
  return reqd.every((k) => typeof a[k] === "string" && (a[k] as string).trim().length > 0);
}

/* ----------------------------- Handler ----------------------------- */

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<Body>;
    const address = body?.address;

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ message: "Invalid address payload" }, { status: 400 });
    }

    await db.connectDb();

    // Prefer the session user id; ignore body.userId for safety
    const user = await User.findById(session.user.id);
    if (!user) {
      await db.disconnectDb();
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Push the new address
    await user.updateOne({
      $push: { address },
    });

    // Return updated address list
    const fresh = await User.findById(user._id).select("address").lean();

    await db.disconnectDb();
    return NextResponse.json({ addresses: fresh?.address ?? [] }, { status: 200 });
  } catch (err: any) {
    console.error("[POST /api/user/saveAddress]", err);
    // best-effort disconnect if db util manages pooling explicitly
    try { await db.disconnectDb(); } catch {}
    return NextResponse.json({ message: err?.message || "Server error" }, { status: 500 });
  }
}