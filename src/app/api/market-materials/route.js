import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

// GET /api/market-materials
// Returns all public materials across users, newest first
export async function GET(request) {
  try {
    const db = await getDb();

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get("pageSize") || "12")));

    const query = { visibility: "public" };
    const total = await db.collection("materials").countDocuments(query);
    const items = await db
      .collection("materials")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    // Normalize address field to ensure frontend consistency
    const normalized = items.map((doc) => ({
      ...doc,
      userAddress: doc.userAddress ?? doc.ownerAddress ?? null,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json(
      { items: normalized, page, pageSize, total, totalPages },
      { status: 200 }
    );
  } catch (err) {
    console.error("Market materials error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}