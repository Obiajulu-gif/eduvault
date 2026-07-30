export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auditLog } from "@/lib/api/audit";
import { withApiHardening } from "@/lib/api/hardening";
import { getDb } from "@/lib/mongodb";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";
import {
  FEEDBACK_COLLECTION,
  feedbackModerationPlaceholder,
  isCreatorFeedback,
  sanitizeFeedback,
  summarizeFeedback,
  validateFeedbackPayload,
} from "@/lib/backend/materialFeedback";

export const runtime = "nodejs";

function materialObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

async function findPublicMaterial(db, id) {
  const objectId = materialObjectId(id);
  if (!objectId) return null;
  return db.collection("materials").findOne({ _id: objectId, visibility: "public" });
}

function feedbackFilter(id) {
  return {
    $or: [
      { materialId: id },
      ...(materialObjectId(id) ? [{ materialObjectId: materialObjectId(id) }] : []),
    ],
    status: { $ne: "hidden" },
    moderationStatus: { $ne: "rejected" },
  };
}

async function getReviewerAddress(db, user) {
  let address = user?.walletAddress || user?.address || user?.walletAddressLower || user?.id || "";

  if (!address && user?.sub && ObjectId.isValid(user.sub)) {
    const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.sub) });
    address = dbUser?.walletAddress || dbUser?.address || dbUser?.walletAddressLower || "";
  }

  return typeof address === "string" ? address.trim() : "";
}

async function updateMaterialFeedbackSummary(db, materialId) {
  const items = await db.collection(FEEDBACK_COLLECTION).find(feedbackFilter(materialId)).toArray();
  const summary = summarizeFeedback(items);
  const objectId = materialObjectId(materialId);

  if (objectId) {
    await db.collection("materials").updateOne(
      { _id: objectId },
      {
        $set: {
          averageScore: summary.averageScore,
          rating: summary.averageScore,
          feedbackCount: summary.feedbackCount,
          reviewsCount: summary.feedbackCount,
          updatedAt: new Date(),
        },
      }
    );
  }

  return { ...summary, items };
}

export async function GET(request, { params }) {
  return withApiHardening(
    request,
    { route: "materials.feedback", rateLimit: { limit: 120, windowMs: 60_000 } },
    async () => {
      try {
        const materialId = params?.id;
        if (!materialId || !ObjectId.isValid(materialId)) {
          return errorResponse("Invalid material ID", 400);
        }

        const db = await getDb();
        const material = await findPublicMaterial(db, materialId);
        if (!material) {
          return errorResponse("Material not found", 404);
        }

        const items = await db
          .collection(FEEDBACK_COLLECTION)
          .find(feedbackFilter(materialId))
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray();
        const summary = summarizeFeedback(items);

        return NextResponse.json({
          items: items.map(sanitizeFeedback),
          ...summary,
          moderation: feedbackModerationPlaceholder(),
        });
      } catch (err) {
        auditLog({ event: "material_feedback_list_failed", route: "materials.feedback", method: "GET", status: 500, reason: err.message });
        return errorResponse("Server error", 500);
      }
    }
  );
}

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

          const payload = validateFeedbackPayload(await authorizedRequest.json());
          const db = await getDb();
          const material = await findPublicMaterial(db, materialId);
          if (!material) {
            return errorResponse("Material not found", 404);
          }

          const reviewerAddress = await getReviewerAddress(db, fullUser);
          if (!reviewerAddress) {
            return errorResponse("A wallet address is required to leave feedback.", 400);
          }

          if (isCreatorFeedback(material, reviewerAddress)) {
            auditLog({ event: "creator_feedback_blocked", route: "materials.feedback", method: "POST", status: 403, actor: userId, materialId });
            return errorResponse("Creators cannot score their own resource.", 403);
          }

          const now = new Date();
          const materialObjectIdValue = new ObjectId(materialId);
          const feedbackDoc = {
            materialId,
            materialObjectId: materialObjectIdValue,
            score: payload.score,
            rating: payload.score,
            comment: payload.comment,
            reviewerAddress,
            reviewerId: userId,
            reviewerName: fullUser.name || "",
            verifiedBuyer: false,
            moderationStatus: "pending_review",
            status: "published",
            updatedAt: now,
          };

          const result = await db.collection(FEEDBACK_COLLECTION).findOneAndUpdate(
            { materialId, reviewerAddress },
            { $set: feedbackDoc, $setOnInsert: { createdAt: now } },
            { upsert: true, returnDocument: "after" }
          );

          const { items, averageScore, feedbackCount } = await updateMaterialFeedbackSummary(db, materialId);
          const savedFeedback = result || items.find((item) => item.reviewerAddress === reviewerAddress) || feedbackDoc;

          auditLog({ event: "material_feedback_saved", route: "materials.feedback", method: "POST", status: 200, actor: userId, materialId });
          return NextResponse.json({
            feedback: sanitizeFeedback(savedFeedback),
            averageScore,
            feedbackCount,
            moderation: feedbackModerationPlaceholder(),
          });
        } catch (err) {
          if (err.name === "ValidationError") {
            return errorResponse(err.message, 400, err.details);
          }

          auditLog({ event: "material_feedback_save_failed", route: "materials.feedback", method: "POST", status: 500, reason: err.message });
          return errorResponse("Server error", 500);
        }
      },
      {}
    )(request);
  },
  { route: "materials.feedback", rateLimit: { limit: 30, windowMs: 60_000 } }
);