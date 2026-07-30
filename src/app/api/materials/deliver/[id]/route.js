export const dynamic = "force-dynamic";

import { getDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { withApiHardening } from "@/lib/api/hardening";
import { auditLog } from "@/lib/api/audit";
import { verifyEntitlement } from "@/lib/entitlement";
import { getIpfsUrl } from "@/lib/config/chain";
import { normalizeBuyerAddress } from "@/lib/purchases/access";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";

export async function GET(request, context) {
  return withApiHardening(
    request,
    { route: "material-deliver", rateLimit: { limit: 60, windowMs: 60_000 } },
    async () => {
      return withAuthorization(async ({ userId, fullUser }) => {
        const { id } = await context.params;

        // ── 1. Validate material ID format ─────────────────────────────────
        if (!id || !ObjectId.isValid(id)) {
          auditLog({ event: "deliver_invalid_id", route: "material-deliver", method: "GET", status: 400, materialId: id });
          return errorResponse("Invalid material ID", 400);
        }

        // ── 2. Authenticate ────────────────────────────────────────────────
        if (!userId) {
          auditLog({ event: "deliver_auth_failed", route: "material-deliver", method: "GET", status: 401 });
          return errorResponse("Authentication required", 401);
        }

        const userAddress = normalizeBuyerAddress(fullUser?.walletAddress || fullUser?.address || userId);
        if (!userAddress) {
          auditLog({ event: "deliver_no_address", route: "material-deliver", method: "GET", status: 400, actor: userId });
          return errorResponse("No wallet address on account", 400);
        }

        // ── 3. Resolve material ────────────────────────────────────────────
        const db = await getDb();
        let material;
        try {
          material = await db.collection("materials").findOne({ _id: new ObjectId(id) });
        } catch (err) {
          auditLog({ event: "deliver_db_error", route: "material-deliver", method: "GET", status: 500, materialId: id });
          return errorResponse("Internal server error", 500);
        }

        if (!material) {
          auditLog({ event: "deliver_not_found", route: "material-deliver", method: "GET", status: 404, materialId: id });
          return errorResponse("Material not found", 404);
        }

        // ── 4. Verify access ───────────────────────────────────────────────
        const isOwner =
          normalizeBuyerAddress(material.userAddress) === userAddress ||
          normalizeBuyerAddress(material.ownerAddress) === userAddress;

        let hasAccess = isOwner;
        let accessSource = "owner";

        if (!hasAccess) {
          const price = Number(material.price || 0);
          if (price <= 0 && material.visibility === "public") {
            hasAccess = true;
            accessSource = "free-public";
          } else {
            const entitlement = await verifyEntitlement(id, userAddress);
            hasAccess = entitlement.hasAccess;
            accessSource = entitlement.source;
          }
        }

        if (!hasAccess) {
          auditLog({
            event: "deliver_access_denied",
            route: "material-deliver",
            method: "GET",
            status: 403,
            actor: userId,
            walletAddress: userAddress,
            materialId: id,
          });
          return errorResponse("Access denied. You do not have permission to access this material.", 403);
        }

        // ── 5. Resolve file reference ──────────────────────────────────────
        const cid = material.ipfsCid ?? material.cid ?? material.fileHash ?? material.storageKey ?? material.fileUrl ?? "";
        if (!cid) {
          auditLog({
            event: "deliver_no_file",
            route: "material-deliver",
            method: "GET",
            status: 404,
            actor: userId,
            materialId: id,
          });
          return errorResponse("Material has no associated file", 404);
        }

        const fileUrl = getIpfsUrl(cid);

        // ── 6. Log and return ─────────────────────────────────────────────
        auditLog({
          event: "deliver_granted",
          route: "material-deliver",
          method: "GET",
          status: 200,
          actor: userId,
          walletAddress: userAddress,
          materialId: id,
        });

        return NextResponse.json(
          {
            success: true,
            downloadUrl: fileUrl,
            fileName: material.fileName ?? material.title ?? id,
            contentType: material.contentType ?? "application/octet-stream",
            source: accessSource,
          },
          {
            headers: {
              "Cache-Control": "private, max-age=60",
              "X-Access-Source": accessSource,
            },
          }
        );
      })(request, context);
    }
  );
}