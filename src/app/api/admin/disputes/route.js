export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { withAuthorization } from "@/lib/auth/authorize";
import { isAdmin } from "@/lib/auth/policies";
import { errorResponse } from "@/lib/api/errorResponse";

export const GET = withAuthorization(
  async (request) => {
    try {
      const db = await getDb();
      const disputes = await db
        .collection("disputes")
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return NextResponse.json({ disputes });
    } catch (error) {
      console.error("[admin/disputes] GET error:", error);
      return errorResponse("Internal Server Error", 500);
    }
  },
  {
    checkOwnership: async (userId, fullUser) => {
      return isAdmin(fullUser);
    },
  }
);

export const PATCH = withAuthorization(
  async (request) => {
    try {
      const { userId } = request;
      const { disputeId, status, resolution } = await request.json();
      if (!disputeId || !status) {
        return errorResponse("disputeId and status are required", 400);
      }

      const db = await getDb();
      const result = await db.collection("disputes").updateOne(
        { _id: disputeId },
        {
          $set: {
            status,
            resolution: resolution ?? null,
            resolvedBy: userId,
            resolvedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return errorResponse("Dispute not found", 404);
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[admin/disputes] PATCH error:", error);
      return errorResponse("Internal Server Error", 500);
    }
  },
  {
    checkOwnership: async (userId, fullUser) => {
      return isAdmin(fullUser);
    },
  }
);