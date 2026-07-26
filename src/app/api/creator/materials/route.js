import { NextResponse } from "next/server";
import { withApiHardening } from "@/lib/api/hardening";
import { getDb } from "@/lib/mongodb";
import { auditLog } from "@/lib/api/audit";
import { errorResponse } from "@/lib/api/errorResponse";
import { withAuthorization } from "@/lib/auth/authorize";

const PAGE_SIZE = 10;

function sanitizeMaterial(doc) {
  if (!doc) return doc;
  const { storageKey, fileUrl, metadataUrl, ...safe } = doc;
  return safe;
}

export const GET = withApiHardening(
  withAuthorization(
    async (authorizedRequest) => {
      const { userId } = authorizedRequest;
      const url = new URL(authorizedRequest.url);
      const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
      const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || String(PAGE_SIZE), 10)));
      const skip = (page - 1) * limit;

      try {
        const db = await getDb();
        const filter = { userAddress: userId }; // Assuming userId is the userAddress
        const [items, total] = await Promise.all([
          db.collection("materials").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
          db.collection("materials").countDocuments(filter),
        ]);

        return NextResponse.json({
          materials: items.map(sanitizeMaterial),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      } catch (err) {
        auditLog({ event: "creator_materials_failed", route: "creator/materials", method: "GET", status: 500, reason: err.message, actor: userId });
        return errorResponse("Failed to fetch creator materials.", 500);
      }
    },
    {
      checkOwnership: async () => true, // Any authenticated user can view their own materials
    }
  ),
  { route: "creator-materials", rateLimit: { limit: 60, windowMs: 60_000 } }
);