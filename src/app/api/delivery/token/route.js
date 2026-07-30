/**
 * POST /api/delivery/token
 *
 * Issues a short-lived, audience-bound delivery token after verifying
 * entitlement. This replaces the old pattern of returning the raw IPFS URL.
 *
 * The token is bound to:
 *   - The authenticated user (from session cookie)
 *   - The requested material
 *   - A 15-minute expiry
 *   - An optional single-use nonce
 *
 * The client then uses this token to call GET /api/delivery/stream
 * which proxies the file bytes without exposing the CID.
 */

import { NextResponse } from 'next/server';
import { withApiHardening } from '@/lib/api/hardening';
import { verifyEntitlement } from '@/lib/entitlement';
import { issueDeliveryToken } from '@/lib/delivery/token';
import { getMaterialRecord } from '@/lib/delivery/stream';
import { recordDeliveryAudit } from '@/lib/delivery/audit';
import { normalizeBuyerAddress } from '@/lib/purchases/access';
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/error-response";

export const dynamic = 'force-dynamic';

export const POST = withApiHardening(
  async (request) => {
    return withAuthorization(
      async (authorizedRequest) => {
        const startedAt = Date.now();
        const { userId, fullUser } = authorizedRequest;

        try {
          const buyerAddress = normalizeBuyerAddress(userId);
          if (!buyerAddress) {
            await recordDeliveryAudit({
              event: 'delivery_token_denied',
              actor: userId,
              result: 'no_wallet_address',
              statusCode: 400,
            });
            return errorResponse('No wallet address on account', 400);
          }

          // ── 2. Parse request body ────────────────────────────────────────────
          let body;
          try {
            body = await authorizedRequest.json();
          } catch {
            return errorResponse('Invalid JSON body', 400);
          }

          const { materialId, singleUse = false, ttlSeconds } = body;

          if (!materialId || typeof materialId !== 'string') {
            return errorResponse('materialId is required', 400);
          }

          // Entitlement check is now handled by checkOwnership in withAuthorization
          // ── 4. Get material record (validate it exists) ──────────────────────
          const material = await getMaterialRecord(materialId);
          if (!material) {
            await recordDeliveryAudit({
              event: 'delivery_token_denied',
              actor: userId,
              buyerAddress,
              materialId,
              result: 'material_not_found',
              statusCode: 404,
            });
            return errorResponse('Material not found', 404);
          }

          // ── 5. Issue delivery token ──────────────────────────────────────────
          const clientIp =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            null;

          const { token, expiresAt } = await issueDeliveryToken({
            buyerAddress,
            materialId,
            ttlSeconds: ttlSeconds || 15 * 60,
            singleUse,
            ipRestriction: null, // IP binding is optional; set via env if needed
          });

          // ── 6. Audit ─────────────────────────────────────────────────────────
          await recordDeliveryAudit({
            event: 'delivery_token_issued',
            actor: userId,
            buyerAddress,
            materialId,
            result: 'success',
            statusCode: 200,
            durationMs: Date.now() - startedAt,
            userAgent: request.headers.get('user-agent') || null,
            clientIp,
          });

          // ── 7. Return token (NOT the CID or gateway URL) ─────────────────────
          return NextResponse.json(
            {
              success: true,
              token,
              expiresAt,
              materialId,
              fileName: material.fileName,
              contentType: material.contentType,
              fileSize: material.fileSize,
              // No CID, no gateway URL — the token is the only access credential
            },
            {
              headers: {
                'Cache-Control': 'private, no-store',
                'X-Token-Expires': String(expiresAt),
              },
            }
          );
        } catch (err) {
          await recordDeliveryAudit({
            event: 'delivery_token_error',
            result: 'error',
            errorReason: err.message,
            statusCode: 500,
            durationMs: Date.now() - startedAt,
            actor: userId,
          });
          return errorResponse('Failed to issue delivery token', 500);
        }
      },
      {
        checkOwnership: async (userId, fullUser, request) => {
          let body;
          try {
            body = await request.json();
          } catch (e) {
            return false; // Invalid JSON, cannot determine materialId
          }
          const { materialId } = body;

          if (!materialId || typeof materialId !== 'string') {
            return false; // Missing materialId, cannot determine entitlement
          }

          const buyerAddress = normalizeBuyerAddress(userId);
          if (!buyerAddress) {
            return false; // No wallet address for user
          }

          const entitlement = await verifyEntitlement(materialId, buyerAddress);
          if (!entitlement.hasAccess) {
            await recordDeliveryAudit({
              event: 'delivery_token_denied',
              actor: userId,
              buyerAddress,
              materialId,
              result: 'no_entitlement',
              statusCode: 403,
            });
            return false;
          }
          return true;
        },
      }
    )(request);
  },
  { route: 'delivery-token', rateLimit: { limit: 30, windowMs: 60_000 } }
);