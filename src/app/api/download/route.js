/**
 * GET /api/download — Issue #63 (Refactored for authenticated streaming)
 *
 * Protected file delivery endpoint. Verifies the caller holds an active
 * on-chain entitlement for the requested material before releasing the
 * IPFS CID or proxying the file stream. Verifies file integrity against
 * the purchased manifest version.
 *
 * Query params:
 *   - materialId  : The material identifier
 *   - buyerAddress: The buyer's Stellar public key
 *   - version     : Optional specific version to download
 *
 * Flow:
 *  1. Validate params
 *  2. verifyEntitlement() — checks cache → DB → chain
 *  3. Fetch material record to get the IPFS CID
 *  4. Verify manifest digest and version binding
 *  5. Return a signed/time-limited redirect to the IPFS gateway
 *     (or stream the file through the Next.js edge)
 */

import { NextResponse } from 'next/server';
import { withApiHardening } from '@/lib/api/hardening';
import { errorResponse } from '@/lib/api/errorResponse';
import { verifyEntitlement } from '@/lib/entitlement';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getManifest, getLatestManifest } from '@/lib/provenance/registry';
import { verifyManifestDigest, verifyFileCid } from '@/lib/provenance/verify';
import { resolveAuthenticatedWallet } from '@/lib/auth/walletIdentity';

export const dynamic = 'force-dynamic';

export const GET = withApiHardening(
  async (request) => {
  const { searchParams } = new URL(request.url);
  const materialId = searchParams.get('materialId') ?? '';
  const identity = await resolveAuthenticatedWallet(request);
  if (!identity.ok) {
    return errorResponse(identity.error, identity.status);
  }
  const buyerAddress = identity.walletAddress;
  const requestedVersion = searchParams.get('version');

  const startedAt = Date.now();

  // ── 1. Validate params ─────────────────────────────────────────────────────

  if (!materialId) {
    return errorResponse('Missing materialId', 400);
  }

  // ── 2. Verify entitlement ─────────────────────────────────────────────────

  let entitlementResult;
  try {
    entitlementResult = await verifyEntitlement(materialId, buyerAddress);
  } catch (err) {
    console.error('[download] entitlement check error:', err);
    return errorResponse('Entitlement verification failed', 503);
  }

  if (!entitlementResult.hasAccess) {
    return errorResponse(
      'You do not hold an active entitlement for this material. Purchase it first.',
      403
    );
  }

  // ── 3. Fetch material record to get the IPFS CID ──────────────────────────

  let material;
  try {
    const db = await getDb();
    material = await db.collection('materials').findOne({ materialId });
    if (!material && ObjectId.isValid(materialId)) {
      material = await db
        .collection('materials')
        .findOne({ _id: new ObjectId(materialId) });
    }
  } catch (err) {
    console.error('[download] DB error fetching material:', err);
    return errorResponse('Material lookup failed', 503);
  }

  if (!material) {
    return errorResponse('Material not found', 404);
  }

  const cid =
    material.ipfsCid ??
    material.cid ??
    material.fileHash ??
    material.storageKey ??
    material.fileUrl ??
    '';

  if (!cid) {
    return errorResponse('Material has no associated file CID', 404);
  }

  // ── 4. Verify manifest version binding ────────────────────────────────────

  let manifestVersion = null;
  let manifestDigestVerified = false;

  try {
    let manifestDoc = null;

    if (requestedVersion) {
      const versionNum = parseInt(requestedVersion, 10);
      if (Number.isFinite(versionNum) && versionNum > 0) {
        manifestDoc = await getManifest(materialId, versionNum);
      }
    }

    if (!manifestDoc) {
      manifestDoc = await getLatestManifest(materialId);
    }

    if (manifestDoc) {
      manifestVersion = manifestDoc.version;
      const versionWithdrawn = manifestDoc.withdrawn === true;

      if (versionWithdrawn) {
        return errorResponse(
          `Version ${manifestVersion} has been withdrawn: ${manifestDoc.withdrawalReason || 'No reason specified'}`,
          410
        );
      }

      manifestDigestVerified = verifyManifestDigest(
        manifestDoc.manifest,
        manifestDoc.digest
      );

      // Verify the served CID matches the manifest
      const cidMatch = verifyFileCid(materialId, manifestVersion, cid);
      if (!cidMatch.valid) {
        console.warn('[download] CID mismatch:', cidMatch.detail);
      }
    }
  } catch (manifestErr) {
    console.warn('[download] Manifest verification error:', manifestErr?.message);
  }

  // ── 5. Release CID / redirect to IPFS gateway ────────────────────────────

  return NextResponse.json(
    {
      ok: true,
      materialId,
      cid: cid,
      manifestVersion,
      manifestDigestVerified,
      fileName: material.fileName ?? material.title ?? materialId,
      contentType: material.contentType ?? 'application/octet-stream',
      fileSize: material.fileSize || 0,
      source: entitlementResult.source,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Entitlement-Source': entitlementResult.source,
        'X-Manifest-Version': manifestVersion ? String(manifestVersion) : '',
        'X-Manifest-Verified': manifestDigestVerified ? 'true' : 'false',
      },
    }
  );
  },
  {
    route: 'download',
    rateLimit: { limit: 100, windowMs: 60_000 }, // 100 downloads/min per IP
  }
);