import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/utils/db";
import User from "@/models/User";

export async function DELETE(request: Request) {
  // Extract id from the URL
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  await user.deleteOne();
  return NextResponse.json({ message: "User deleted" });
}