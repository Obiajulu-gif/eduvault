import { NextResponse } from "next/server";
import { withApiHardening } from "@/lib/api/hardening";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuthorization } from "@/lib/auth/authorize";

export const runtime = "nodejs";

export const GET = withApiHardening(
  withAuthorization(
    async (authorizedRequest, { params }) => {
      try {
        const { userId } = authorizedRequest;
        const db = await getDb();
        const collectionId = params.id;

        let query = {};
        try {
          query._id = new ObjectId(collectionId);
        } catch (e) {
          return errorResponse("Invalid collection ID", 400);
        }

        const collection = await db.collection("collections").findOne(query);

        if (!collection) {
          return errorResponse("Collection not found", 404);
        }

        // Fetch materials in this collection
        let materials = [];
        if (collection.materialIds && collection.materialIds.length > 0) {
          const materialObjectIds = collection.materialIds.map(id => {
            try { return new ObjectId(id); } catch { return id; }
          });
          materials = await db.collection("materials").find({ _id: { $in: materialObjectIds } }).toArray();
        }

        return NextResponse.json({ ...collection, materials });
      } catch (err) {
        console.error("[api/collections/[id]] GET error:", err);
        return errorResponse("Server error", 500);
      }
    },
    {
      checkOwnership: async (userId, fullUser, request, { params }) => {
        const db = await getDb();
        const collectionId = params.id;
        let query = {};
        try {
          query._id = new ObjectId(collectionId);
        } catch (e) {
          return false; // Invalid ID, deny access
        }
        const collection = await db.collection("collections").findOne(query);
        return collection && collection.creatorId === userId;
      },
    }
  ),
  { route: "collection_detail", rateLimit: { limit: 80, windowMs: 60_000 } }
);