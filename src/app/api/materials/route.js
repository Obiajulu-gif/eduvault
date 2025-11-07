import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

async function getUserFromCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/auth_token=([^;]+)/);
  const token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromCookie(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      usageRights,
      visibility,
      thumbnailUrl,
      fileUrl,
    } = body || {};

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();

    // Resolve uploader wallet address reliably
    let userAddress = user.walletAddress || user.address || null;
    if (!userAddress && user.sub) {
      try {
        const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.sub) });
        userAddress = dbUser?.walletAddress || dbUser?.walletAddressLower || null;
      } catch (e) {
        // best-effort; keep null if lookup fails
        console.warn("User lookup failed while creating material:", e?.message || e);
      }
    }

    const doc = {
      userAddress,
      title,
      description: description || "",
      price: typeof price === "number" ? price : Number(price) || 0,
      usageRights: usageRights || "",
      visibility: visibility || "private",
      thumbnailUrl: thumbnailUrl || null,
      fileUrl,
      createdAt: new Date(),
    };

    const result = await db.collection("materials").insertOne(doc);
    return NextResponse.json({ id: result.insertedId, ...doc }, { status: 201 });
  } catch (err) {
    console.error("Create material error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromCookie(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userAddress = user.walletAddress || user.address || user.id;
    const items = await db
      .collection("materials")
      .find({ userAddress })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(items);
  } catch (err) {
    console.error("List materials error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}