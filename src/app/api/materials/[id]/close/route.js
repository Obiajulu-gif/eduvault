export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/api/auth";
import { auditLog } from "@/lib/api/audit";
import {
  transitionMaterialStatus,
  MaterialLifecycleError,
  LIFECYCLE_ERROR_HTTP_STATUS,
  MATERIAL_STATUS,
} from "@/lib/materials/materialLifecycle";

/**
 * POST /api/materials/[id]/close
 *
 * Transitions a published material to closed: it stops accepting new
 * purchases but existing entitlements are unaffected. Owner or admin only.
 */
export async function POST(request, { params }) {
  try {
    const materialId = params?.id;
    if (!materialId) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const user = await getUserFromCookie(request);
    if (!user) {
      auditLog({ event: "close_auth_failed", route: "material-close", method: "POST", status: 401, materialId });
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;

    const result = await transitionMaterialStatus({
      materialId,
      actor: user,
      toStatus: MATERIAL_STATUS.CLOSED,
      reason,
    });

    auditLog({
      event: result.alreadyInStatus ? "close_already_closed" : "close_success",
      route: "material-close",
      method: "POST",
      status: 200,
      actor: user.sub,
      materialId,
    });

    return NextResponse.json(
      { success: true, status: MATERIAL_STATUS.CLOSED, alreadyClosed: result.alreadyInStatus },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof MaterialLifecycleError) {
      const status = LIFECYCLE_ERROR_HTTP_STATUS[err.code] ?? 400;
      auditLog({
        event: "close_failed",
        route: "material-close",
        method: "POST",
        status,
        materialId: params?.id,
        reason: err.message,
      });
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("Close error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
