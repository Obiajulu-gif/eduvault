export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auditLog } from "@/lib/api/audit";
import { withApiHardening } from "@/lib/api/hardening";
import { getDb } from "@/lib/mongodb";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";

const NOTES_COLLECTION = "learner_notes";
const MAX_NOTE_LENGTH = 5000;

function makeFilter(materialId, walletAddress) {
  return { materialId, walletAddress: walletAddress.toLowerCase() };
}

// GET /api/materials/[id]/notes — fetch the current user's note for this resource
export const GET = withApiHardening(
  async (request, { params }) => {
    return withAuthorization(
      async (authorizedRequest) => {
        const materialId = params?.id;
        if (!materialId || !ObjectId.isValid(materialId)) {
          return errorResponse("Invalid material ID", 400);
        }

        const { userId, fullUser } = authorizedRequest;

        const walletAddress = (fullUser.walletAddress || userId || "").toLowerCase();
        if (!walletAddress) {
          return errorResponse("No wallet address found", 400);
        }

        try {
          const db = await getDb();
          const doc = await db.collection(NOTES_COLLECTION).findOne(makeFilter(materialId, walletAddress));

          return NextResponse.json({
            note: doc?.note ?? "",
            updatedAt: doc?.updatedAt ?? null,
          });
        } catch (err) {
          auditLog({ event: "notes_fetch_failed", route: "materials.notes", method: "GET", status: 500, reason: err.message });
          return errorResponse("Server error", 500);
        }
      },
      {}
    )(request);
  },
  { route: "materials.notes", rateLimit: { limit: 60, windowMs: 60_000 } }
);

// PUT /api/materials/[id]/notes — upsert the current user's note for this resource
export const PUT = withApiHardening(
  async (request, { params }) => {
    return withAuthorization(
      async (authorizedRequest) => {
        const materialId = params?.id;
        if (!materialId || !ObjectId.isValid(materialId)) {
          return errorResponse("Invalid material ID", 400);
        }

        const { userId, fullUser } = authorizedRequest;

        const walletAddress = (fullUser.walletAddress || userId || "").toLowerCase();
        if (!walletAddress) {
          return errorResponse("No wallet address found", 400);
        }

        let body;
        try {
          body = await authorizedRequest.json();
        } catch {
          return errorResponse("Invalid JSON", 400);
        }

        const note = typeof body?.note === "string" ? body.note.slice(0, MAX_NOTE_LENGTH) : "";

        try {
          const db = await getDb();
          const now = new Date();
          const filter = makeFilter(materialId, walletAddress);

          await db.collection(NOTES_COLLECTION).updateOne(
            filter,
            { $set: { note, updatedAt: now }, $setOnInsert: { createdAt: now } },
            { upsert: true }
          );

          auditLog({ event: "notes_saved", route: "materials.notes", method: "PUT", status: 200, actor: userId });
          return NextResponse.json({ note, updatedAt: now.toISOString() });
        } catch (err) {
          auditLog({ event: "notes_save_failed", route: "materials.notes", method: "PUT", status: 500, reason: err.message });
          return errorResponse("Server error", 500);
        }
      },
      {}
    )(request);
  },
  { route: "materials.notes", rateLimit: { limit: 30, windowMs: 60_000 } }
);