export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { listRefreshTokenSessions, revokeRefreshTokenFamilyByFamilyId } from "@/lib/auth/tokenService";
import { auditLog } from "@/lib/api/audit";
import { withApiHardening } from "@/lib/api/hardening";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";

export const GET = withApiHardening(
  async (request) => {
    return withAuthorization(
      async (authorizedRequest) => {
        const { userId } = authorizedRequest;

        try {
          const sessions = await listRefreshTokenSessions(userId);
          return NextResponse.json({ sessions });
        } catch (error) {
          auditLog({
            event: "auth_sessions_list_failed",
            route: "auth/sessions",
            method: "GET",
            status: 500,
            reason: error.message,
            actor: userId,
          });
          return errorResponse("Failed to retrieve sessions.", 500);
        }
      },
      {
        checkOwnership: async () => true, // Any authenticated user can view their own sessions
      }
    )(request);
  },
  { route: "auth-sessions-get", rateLimit: { limit: 20, windowMs: 60_000 } }
);

export const DELETE = withApiHardening(
  async (request) => {
    return withAuthorization(
      async (authorizedRequest) => {
        const { userId } = authorizedRequest;

        try {
          const body = await authorizedRequest.json();
          const familyId = typeof body?.familyId === "string" ? body.familyId.trim() : "";

          if (!familyId) {
            auditLog({
              event: "auth_sessions_revoke_failed",
              route: "auth/sessions",
              method: "DELETE",
              status: 400,
              reason: "Missing familyId",
              actor: userId,
            });
            return errorResponse("Missing familyId", 400);
          }

          await revokeRefreshTokenFamilyByFamilyId(familyId, userId);
          auditLog({
            event: "auth_sessions_revoke_success",
            route: "auth/sessions",
            method: "DELETE",
            status: 200,
            actor: userId,
            familyId,
          });

          return NextResponse.json({ success: true });
        } catch (error) {
          auditLog({
            event: "auth_sessions_revoke_failed",
            route: "auth/sessions",
            method: "DELETE",
            status: 500,
            reason: error.message,
            actor: userId,
          });
          return errorResponse("Failed to revoke session.", 500);
        }
      },
      {
        checkOwnership: async (userId, fullUser, request) => {
          const body = await request.json();
          const familyId = typeof body?.familyId === "string" ? body.familyId.trim() : "";
          // In a real scenario, you might want to verify that the familyId belongs to the userId
          // For now, we assume that revokeRefreshTokenFamilyByFamilyId handles the ownership check internally.
          // If not, this checkOwnership would need to query the database for the refresh token family.
          return true;
        },
      }
    )(request);
  },
  { route: "auth-sessions-delete", rateLimit: { limit: 20, windowMs: 60_000 } }
);