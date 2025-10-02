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

type AddressLean = {
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
};

/* ----------------------------- Utils ----------------------------- */

const isValidObjectId = (id?: string): id is string =>
  !!id && mongoose.Types.ObjectId.isValid(id);

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Server error");

/* -------------------------------- PUT --------------------------------
   Mark one address as active (others inactive) on the `address` array
------------------------------------------------------------------------ */
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

    // Ensure user exists and has the `address` array
    const hasUser = await User.exists({ _id: session.user.id });
    if (!hasUser) {
      await db.disconnectDb();
      return NextResponse.json<ErrorResp>({ message: "User not found." }, { status: 404 });
    }

    // 1) Set all addresses inactive
    await User.updateOne(
      { _id: session.user.id },
      { $set: { "address.$[].active": false } }
    );

    // 2) Set the selected one active using arrayFilters
    const upd = await User.updateOne(
      { _id: session.user.id },
      { $set: { "address.$[elem].active": true } },
      { arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(id) }] }
    );

    if (upd.matchedCount === 0) {
      await db.disconnectDb();
      return NextResponse.json<ErrorResp>({ message: "Address not found." }, { status: 404 });
    }

    // 3) Return fresh list
    const fresh = await User.findById(session.user.id)
      .select("address")
      .lean<{ address?: AddressLean[] } | null>();

    await db.disconnectDb();
    return NextResponse.json({ addresses: fresh?.address ?? [] }, { status: 200 });
  } catch (e) {
    try { await db.disconnectDb(); } catch {}
    return NextResponse.json<ErrorResp>({ message: errMsg(e) }, { status: 500 });
  }
}

/* ------------------------------- DELETE -------------------------------
   Remove an address by _id from `address`
------------------------------------------------------------------------ */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ErrorResp>({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = (await req.json()) as IdBody; // DELETE with JSON body via fetch
    if (!isValidObjectId(id)) {
      return NextResponse.json<ErrorResp>({ message: "Invalid address ID." }, { status: 400 });
    }

    await db.connectDb();

    const upd = await User.updateOne(
      { _id: session.user.id },
      { $pull: { address: { _id: new mongoose.Types.ObjectId(id) } } }
    );

    if (upd.modifiedCount === 0) {
      await db.disconnectDb();
      return NextResponse.json<ErrorResp>({ message: "Address not found." }, { status: 404 });
    }

    const fresh = await User.findById(session.user.id)
      .select("address")
      .lean<{ address?: AddressLean[] } | null>();

    await db.disconnectDb();
    return NextResponse.json({ addresses: fresh?.address ?? [] }, { status: 200 });
  } catch (e) {
    try { await db.disconnectDb(); } catch {}
    return NextResponse.json<ErrorResp>({ message: errMsg(e) }, { status: 500 });
  }
}