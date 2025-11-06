import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const form = await request.formData();
    const docFile = form.get("file");
    const thumbFile = form.get("thumbnail");

    if (!docFile && !thumbFile) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = {};

    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_RW_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Missing Blob token. Set BLOB_READ_WRITE_TOKEN in your env to enable uploads.",
        },
        { status: 500 }
      );
    }

    if (thumbFile) {
      const thumbBlob = await put(thumbFile.name || "thumbnail", thumbFile, {
        access: "public",
        token,
      });
      results.thumbnail = thumbBlob;
    }

    if (docFile) {
      const docBlob = await put(docFile.name || "document", docFile, {
        access: "public",
        token,
      });
      results.file = docBlob;
    }

    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    console.error("Upload error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}