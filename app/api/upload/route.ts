// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
console.log(
  "[cloudinary env]",
  !!process.env.CLOUDINARY_CLOUD_NAME,
  !!process.env.CLOUDINARY_API_KEY,
  !!process.env.CLOUDINARY_API_SECRET
);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});
function ensureCloudinaryConfigured() {
  const conf = cloudinary.config();
  // If api_key is missing for any reason (e.g., hot reload), re-apply config
  if (!conf.api_key) {
    cloudinary.config({
      cloud_name:
        process.env.CLOUDINARY_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? "",
      api_key:
        process.env.CLOUDINARY_KEY ?? process.env.CLOUDINARY_API_KEY ?? "",
      api_secret:
        process.env.CLOUDINARY_SECRET ?? process.env.CLOUDINARY_API_SECRET ?? "",
      secure: true,
    });
  }
}
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (
        err: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (err || !result) {
          return reject(err ?? new Error("Upload failed"));
        }
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const path = (formData.get("path") as string) || "uploads";
    ensureCloudinaryConfigured();
    const uploaded: Array<{ url: string; public_id: string }> = [];
    for (const file of files) {
      const buffer = await fileToBuffer(file);
      const res = await uploadBufferToCloudinary(buffer, path);
      uploaded.push(res);
    }

    return NextResponse.json(uploaded, { status: 200 });
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { public_id }: { public_id: string } = await req.json();
    // Use the precise return type from the SDK:
    const result: Awaited<ReturnType<typeof cloudinary.uploader.destroy>> =
      await cloudinary.uploader.destroy(public_id);
       ensureCloudinaryConfigured();
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("Cloudinary delete error:", error);
    const message = error instanceof Error ? error.message : "Unknown delete error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}