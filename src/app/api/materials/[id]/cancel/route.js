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
 * POST /api/materials/[id]/cancel
 *
 * Withdraws a draft or published material. A published material can only be
 * canceled if it has no completed purchases yet (use close instead).
 * Owner or admin only.
 */
export async function POST(request, { params }) {
  try {
    const materialId = params?.id;
    if (!materialId) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const user = await getUserFromCookie(request);
    if (!user) {
      auditLog({ event: "cancel_auth_failed", route: "material-cancel", method: "POST", status: 401, materialId });
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;

    const result = await transitionMaterialStatus({
      materialId,
      actor: user,
      toStatus: MATERIAL_STATUS.CANCELED,
      reason,
    });

    auditLog({
      event: result.alreadyInStatus ? "cancel_already_canceled" : "cancel_success",
      route: "material-cancel",
      method: "POST",
      status: 200,
      actor: user.sub,
      materialId,
    });

    return NextResponse.json(
      { success: true, status: MATERIAL_STATUS.CANCELED, alreadyCanceled: result.alreadyInStatus },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof MaterialLifecycleError) {
      const status = LIFECYCLE_ERROR_HTTP_STATUS[err.code] ?? 400;
      auditLog({
        event: "cancel_failed",
        route: "material-cancel",
        method: "POST",
        status,
        materialId: params?.id,
        reason: err.message,
      });
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("Cancel error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
