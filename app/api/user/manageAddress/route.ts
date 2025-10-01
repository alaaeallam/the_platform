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

/* ----------------------------- Utils ----------------------------- */

function isValidObjectId(id?: string): id is string {
  return !!id && mongoose.Types.ObjectId.isValid(id);
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

    // Toggle active flag: only the matching _id becomes true
    user.address = user.address.map((addr: any) => ({
      ...addr.toObject?.() ?? addr,
      active: String(addr._id) === String(id),
    }));

    await user.save();

    const fresh = await User.findById(user._id).select("address").lean();

    await db.disconnectDb();
    return NextResponse.json({ addresses: fresh?.address ?? [] }, { status: 200 });
  } catch (err: any) {
    try { await db.disconnectDb(); } catch {}
    return NextResponse.json<ErrorResp>(
      { message: err?.message || "Failed to update address." },
      { status: 500 }
    );
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

    const { id } = (await req.json()) as IdBody; // DELETE with body is fine via fetch
    if (!isValidObjectId(id)) {
      return NextResponse.json<ErrorResp>({ message: "Invalid address ID." }, { status: 400 });
    }

    await db.connectDb();

    const user = await User.findById(session.user.id);
    if (!user) {
      await db.disconnectDb();
      return NextResponse.json<ErrorResp>({ message: "User not found." }, { status: 404 });
    }

    user.address = user.address.filter((addr: any) => String(addr._id) !== String(id));
    await user.save();

    const fresh = await User.findById(user._id).select("address").lean();

    await db.disconnectDb();
    return NextResponse.json({ addresses: fresh?.address ?? [] }, { status: 200 });
  } catch (err: any) {
    try { await db.disconnectDb(); } catch {}
    return NextResponse.json<ErrorResp>(
      { message: err?.message || "Failed to delete address." },
      { status: 500 }
    );
  }
}