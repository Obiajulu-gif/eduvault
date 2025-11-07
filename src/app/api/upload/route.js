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
      const safeThumbName = (thumbFile.name || "thumbnail")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.\-_]/g, "")
        .toLowerCase();
      const thumbBlob = await put(safeThumbName, thumbFile, {
        access: "public",
        token,
        addRandomSuffix: true,
        contentType: thumbFile.type || undefined,
      });
      results.thumbnail = thumbBlob;
    }

    if (docFile) {
      const safeDocName = (docFile.name || "document")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.\-_]/g, "")
        .toLowerCase();
      const docBlob = await put(safeDocName, docFile, {
        access: "public",
        token,
        addRandomSuffix: true,
        contentType: docFile.type || undefined,
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