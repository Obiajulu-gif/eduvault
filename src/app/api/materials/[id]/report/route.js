import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auditLog } from "@/lib/api/audit";
import { withApiHardening } from "@/lib/api/hardening";
import { getDb } from "@/lib/mongodb";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function materialObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// POST /api/materials/[id]/report
export const POST = withApiHardening(
  async (request, { params }) => {
    return withAuthorization(
      async (authorizedRequest) => {
        try {
          const materialId = params?.id;
          if (!materialId || !ObjectId.isValid(materialId)) {
            return errorResponse("Invalid material ID", 400);
          }

          const { userId, fullUser } = authorizedRequest;

          const body = await authorizedRequest.json();
          const reason = body?.reason;
          const description = body?.description || "";

          if (!reason) {
            return errorResponse("Reason is required to file a report", 400);
          }

          const db = await getDb();
          const material = await db.collection("materials").findOne({ _id: new ObjectId(materialId) });
          if (!material) {
            return errorResponse("Material not found", 404);
          }

          let reporterAddress = fullUser.walletAddress || userId || "";
          if (!reporterAddress && userId && ObjectId.isValid(userId)) {
            const dbUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
            reporterAddress = dbUser?.walletAddress || dbUser?.address || dbUser?.walletAddressLower || "";
          }

          const now = new Date();
          const reportDoc = {
            materialId,
            materialTitle: material.title,
            reason,
            description,
            reporterAddress,
            reporterId: userId,
            reporterName: fullUser.name || "Anonymous",
            status: "pending_review",
            moderationStatus: "pending_review",
            createdAt: now,
            updatedAt: now,
          };

          const result = await db.collection("reports").insertOne(reportDoc);

          auditLog({
            event: "material_reported",
            route: "materials.report",
            method: "POST",
            status: 201,
            actor: userId,
            materialId,
          });

          return NextResponse.json({
            success: true,
            reportId: result.insertedId,
            message: "Your report has been successfully submitted and is under admin review.",
            moderation: {
              status: "pending_review",
              placeholder: "Admin review will process this flag shortly."
            }
          }, { status: 201 });
        } catch (err) {
          auditLog({
            event: "material_report_failed",
            route: "materials.report",
            method: "POST",
            status: 500,
            reason: err.message,
          });
          return errorResponse("Server error", 500);
        }
      },
      {}
    )(request);
  },
  { route: "materials.report", rateLimit: { limit: 10, windowMs: 60_000 } }
);