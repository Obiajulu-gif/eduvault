import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auditLog } from "@/lib/api/audit";
import { getPublishingChecklist } from "@/lib/publishing/checklist";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";
import {
  transitionMaterialStatus,
  MaterialLifecycleError,
  LIFECYCLE_ERROR_HTTP_STATUS,
  MATERIAL_STATUS,
} from "@/lib/materials/materialLifecycle";

export const dynamic = "force-dynamic";

async function lookupMaterial(materialId) {
  const db = await getDb();
  return db.collection("materials").findOne({ _id: materialId });
}

/**
 * POST /api/materials/[id]/publish
 *
 * Transitions a material draft -> published via the material lifecycle
 * state machine.
 */
export const POST = withAuthorization(
  async (authorizedRequest, { params }) => {
    const materialId = params?.id;
    if (!materialId) {
      return errorResponse("Material not found", 404);
    }

    const { userId, fullUser } = authorizedRequest;

    const userAddress = fullUser?.walletAddress || userId;
    if (!userAddress) {
      auditLog({ event: "publish_no_address", route: "material-publish", method: "POST", status: 400, actor: userId, materialId });
      return errorResponse("No wallet address on account", 400);
    }

    const body = await authorizedRequest.json().catch(() => ({}));
    const contractId = typeof body.contractId === "string" ? body.contractId.trim() : undefined;

    let result;
    try {
      result = await transitionMaterialStatus({
        materialId,
        actor: fullUser || { sub: userId, walletAddress: userAddress },
        toStatus: MATERIAL_STATUS.PUBLISHED,
        extraFields: {
          publishedAt: new Date(),
          ...(contractId ? { contractId } : {}),
        },
      });
    } catch (err) {
      if (err instanceof MaterialLifecycleError) {
        const status = LIFECYCLE_ERROR_HTTP_STATUS[err.code] ?? 400;
        auditLog({
          event: "publish_failed",
          route: "material-publish",
          method: "POST",
          status,
          actor: userId,
          materialId,
          reason: err.message,
        });
        return NextResponse.json(
          { error: err.message, code: err.code, checklist: getPublishingChecklist(await lookupMaterial(materialId)) },
          { status }
        );
      }
      console.error("Publish error:", err);
      return errorResponse("Server error", 500);
    }

    const checklist = getPublishingChecklist(result.material);

    auditLog({
      event: result.alreadyInStatus ? "publish_already_published" : "publish_success",
      route: "material-publish",
      method: "POST",
      status: 200,
      actor: userId,
      materialId,
    });

    return NextResponse.json(
      {
        success: true,
        status: MATERIAL_STATUS.PUBLISHED,
        alreadyPublished: result.alreadyInStatus,
        checklist,
      },
      { status: 200 }
    );
  }
);

/**
 * GET /api/materials/[id]/publish
 *
 * Returns the publishing checklist for a material without publishing it.
 */
export const GET = withAuthorization(
  async (authorizedRequest, { params }) => {
    try {
      const materialId = params?.id;
      if (!materialId) {
        return errorResponse("Material not found", 404);
      }

      const { userId, fullUser } = authorizedRequest;

      const userAddress = fullUser?.walletAddress || userId;
      if (!userAddress) {
        return errorResponse("No wallet address on account", 400);
      }

      const material = await lookupMaterial(materialId);

      const checklist = getPublishingChecklist(material);

      const owner = material?.userAddress || material?.ownerAddress;
      const isOwner = material && owner && String(owner).toLowerCase() === String(userAddress).toLowerCase();

      return NextResponse.json({
        materialId,
        canPublish: isOwner && checklist.missingRequired.length === 0,
        isOwner,
        published: material?.status === MATERIAL_STATUS.PUBLISHED || false,
        checklist,
      });
    } catch (err) {
      console.error("Publish checklist error:", err);
      return errorResponse("Server error", 500);
    }
  }
);
