// app/api/debug/ping/route.ts
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ ok: false, name: e?.name, message: e?.message }, { status: 500 });
  }
}