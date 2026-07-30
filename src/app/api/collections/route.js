import { NextResponse } from "next/server";
import { withApiHardening } from "@/lib/api/hardening";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuthorization } from "@/lib/auth/authorize";

export const runtime = "nodejs";

export const POST = withApiHardening(
  withAuthorization(
    async (authorizedRequest) => {
      try {
        const { userId } = authorizedRequest;
        const payload = await authorizedRequest.json();
        const db = await getDb();

        const doc = {
          title: payload.title,
          description: payload.description,
          creatorId: userId,
          materialIds: payload.materialIds || [], // Array of material ObjectId strings or similar
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db.collection("collections").insertOne(doc);
        return NextResponse.json({ id: result.insertedId, ...doc }, { status: 201 });
      } catch (err) {
        console.error("[api/collections] POST error:", err);
        return errorResponse("Server error", 500);
      }
    },
    {
      checkOwnership: async () => true, // Any authenticated user can create a collection
    }
  ),
  { route: "collections", rateLimit: { limit: 40, windowMs: 60_000 } }
);

export const GET = withApiHardening(
  withAuthorization(
    async (authorizedRequest) => {
      try {
        const { userId } = authorizedRequest;
        const db = await getDb();
        const items = await db
          .collection("collections")
          .find({ creatorId: userId }) // Filter by authenticated user's ID
          .sort({ createdAt: -1 })
          .toArray();

        return NextResponse.json(items);
      } catch (err) {
        console.error("[api/collections] GET error:", err);
        return errorResponse("Server error", 500);
      }
    },
    {
      checkOwnership: async () => true, // Any authenticated user can view their own collections
    }
  ),
  { route: "collections", rateLimit: { limit: 80, windowMs: 60_000 } }
);