// app/api/user/manageAddress/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import db from "@/utils/db";
import User from "@/models/User";

/* ----------------------------- Types ----------------------------- */

type IdBody = { id?: string };
type ErrorResp = { message: string };

/** Shape of an address subdocument on the User model (lean or hydrated). */
type AddressDoc = {
  _id: mongoose.Types.ObjectId | string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address1?: string;
  address2?: string;
  country?: string;
  active?: boolean;
  /** Present when the address is a Mongoose subdocument */
  toObject?: () => Omit<AddressDoc, "toObject">;
};

/* ----------------------------- Utils ----------------------------- */

function isValidObjectId(id?: string): id is string {
  return !!id && mongoose.Types.ObjectId.isValid(id);
}

function getErrMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Server error";
}

/* -------------------------------- PUT --------------------------------
   Mark one address as active (and all others inactive)
----------------------------------------------------------------------- */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ErrorResp>({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = (await req.json()) as IdBody;
    if (!isValidObjectId(id)) {
      return NextResponse.json<ErrorResp>({ message: "Invalid address ID." }, { status: 400 });
    }

    await db.connectDb();

    const user = await User.findById(session.user.id);
    if (!user) {
      await db.disconnectDb();
      return NextResponse.json<ErrorResp>({ message: "User not found." }, { status: 404 });
    }

    const current = Array.isArray((user as unknown as { address?: AddressDoc[] }).address)
      ? ((user as unknown as { address: AddressDoc[] }).address)
      : [];

    const updated: AddressDoc[] = current.map((addr) => {
      const plain = typeof addr.toObject === "function" ? addr.toObject() : addr;
      return {
        ...plain,
        active: String(plain._id) === String(id),
      };
    });

    // Write back the normalized array
    user.set("address", updated);
    await user.save();

    const fresh = await User.findById(user._id).select("address").lean<{ address?: AddressDoc[] } | null>();

    await db.disconnectDb();
    return NextResponse.json({ addresses: fresh?.address ?? [] }, { status: 200 });
  } catch (err: unknown) {
    try { await db.disconnectDb(); } catch { /* ignore */ }
    return NextResponse.json<ErrorResp>({ message: getErrMessage(err) }, { status: 500 });
  }
}

/* ------------------------------- DELETE -------------------------------
   Remove an address by _id
------------------------------------------------------------------------ */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ErrorResp>({ message: "Unauthorized" }, { status: 401 });
    }

    // DELETE with JSON body (supported via fetch)
    const { id } = (await req.json()) as IdBody;
    if (!isValidObjectId(id)) {
      return NextResponse.json<ErrorResp>({ message: "Invalid address ID." }, { status: 400 });
    }

    await db.connectDb();

    const user = await User.findById(session.user.id);
    if (!user) {
      await db.disconnectDb();
      return NextResponse.json<ErrorResp>({ message: "User not found." }, { status: 404 });
    }

    const current = Array.isArray((user as unknown as { address?: AddressDoc[] }).address)
      ? ((user as unknown as { address: AddressDoc[] }).address)
      : [];

    const filtered = current.filter((addr) => String(addr._id) !== String(id));

    user.set("address", filtered);
    await user.save();

    const fresh = await User.findById(user._id).select("address").lean<{ address?: AddressDoc[] } | null>();

    await db.disconnectDb();
    return NextResponse.json({ addresses: fresh?.address ?? [] }, { status: 200 });
  } catch (err: unknown) {
    try { await db.disconnectDb(); } catch { /* ignore */ }
    return NextResponse.json<ErrorResp>({ message: getErrMessage(err) }, { status: 500 });
  }
}