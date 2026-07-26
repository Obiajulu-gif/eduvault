import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getDb } from "@/lib/mongodb";
import { validateAuth } from "@/lib/auth/session";
import { ObjectId } from "mongodb";
import { withAuthorization } from "@/lib/auth/authorize";
import { isAdmin } from "@/lib/auth/policies";

/**
 * POST /api/reviews/report
 * Allows creators to flag reviews on their materials for moderation
 */
export const POST = withAuthorization(
  async (request) => {
    const { userId } = request; // userId is now available from withAuthorization
    const body = request.parsedBody; // Use parsedBody from checkOwnership
    const { reviewId, materialId, reason, additionalDetails } = body;

    // Validate required fields
    if (!reviewId || !materialId || !reason) {
      return NextResponse.json(
        { error: "reviewId, materialId, and reason are required" },
        { status: 400 },
      );
    }

    // Validate reason
    const validReasons = ["spam", "abusive", "false", "inappropriate", "other"];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${validReasons.join(", ")}` },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Verify the review exists
    const review = await db.collection("reviews").findOne({
      _id: new ObjectId(reviewId),
      materialId: new ObjectId(materialId),
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found for this material" },
        { status: 404 },
      );
    }

    // Check if this review has already been reported by this creator
    const existingReport = await db.collection("reported_reviews").findOne({
      reviewId: new ObjectId(reviewId),
      reportedBy: userId.toLowerCase(), // Use userId from auth
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this review" },
        { status: 409 },
      );
    }

    // Create moderation ticket
    const report = {
      reviewId: new ObjectId(reviewId),
      materialId: new ObjectId(materialId),
      // materialTitle will be fetched in checkOwnership, but we need it here for the report object.
      // For now, we'll refetch it or pass it from checkOwnership if needed.
      // For simplicity, let's assume materialTitle is not strictly needed for the initial report creation.
      // If it is, we'd need to modify checkOwnership to return the material object.
      reportedBy: userId.toLowerCase(), // Use userId from auth
      reportedAt: new Date(),
      reason,
      additionalDetails: additionalDetails || null,
      status: "pending",
      reviewContent: {
        rating: review.rating,
        comment: review.comment,
        reviewedBy: review.reviewedBy,
        createdAt: review.createdAt,
      },
      moderationAction: null,
      moderatedBy: null,
      notes: null,
    };

    // Fetch material again to get title for report object, or modify checkOwnership to return it.
    // For now, refetching for simplicity.
    const material = await db.collection("materials").findOne({
      _id: new ObjectId(materialId),
    });
    if (material) {
      report.materialTitle = material.title;
    }


    const result = await db.collection("reported_reviews").insertOne(report);

    // Optionally increment a flag count on the review itself
    await db.collection("reviews").updateOne(
      { _id: new ObjectId(reviewId) },
      {
        $inc: { flagCount: 1 },
        $set: { lastFlaggedAt: new Date() },
      },
    );

    return NextResponse.json(
      {
        success: true,
        reportId: result.insertedId.toString(),
        message: "Review reported successfully and queued for moderation",
      },
      { status: 201 },
    );
  },
  {
    checkOwnership: async (userId, fullUser, request) => {
      const body = await request.json();
      request.parsedBody = body; // Store for the handler
      const { materialId } = body;

      if (!materialId) {
        return false; // Cannot check ownership without materialId
      }

      const { db } = await connectToDatabase();
      const material = await db.collection("materials").findOne({
        _id: new ObjectId(materialId),
      });

      if (!material) {
        return false; // Material not found
      }

      // Check if the authenticated user is the creator of the material
      return material.creator?.toLowerCase() === userId.toLowerCase();
    },
  },
);

/**
 * GET /api/reviews/report
 * Get reported reviews (admin only, or user's own reports)
 */
export const GET = withAuthorization(
  async (request) => {
    const { userId, fullUser } = request; // userId and fullUser are now available from withAuthorization
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") || "pending";

      const { db } = await connectToDatabase();

      const query = {};

      // If the user is an admin, they can view all reports (filtered by status)
      // Otherwise, non-admin users can only view their own reports.
      if (!fullUser.isAdmin) { // fullUser.isAdmin is set in the checkOwnership function below
        query.reportedBy = userId.toLowerCase();
      }

      if (status !== "all") {
        query.status = status;
      }

      const reports = await db
        .collection("reported_reviews")
        .find(query)
        .sort({ reportedAt: -1 })
        .limit(50)
        .toArray();

      return NextResponse.json({
        success: true,
        reports: reports.map((r) => ({
          ...r,
          _id: r._id.toString(),
          reviewId: r.reviewId.toString(),
          materialId: r.materialId.toString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching reported reviews:", error);
      return NextResponse.json(
        { error: "Failed to fetch reported reviews", details: error.message },
        { status: 500 },
      );
    }
  },
  {
    // This checkOwnership function is used to determine if the user is an admin
    // and to make that information available to the handler.
    checkOwnership: async (userId, fullUser, request) => {
      // For the GET route, we don't have a specific resource to own in the traditional sense.
      // Instead, we're using this to determine if the user is an admin.
      // We'll attach an 'isAdmin' property to the fullUser object for the handler to use.
      // This is a temporary way to pass the admin status. A more robust solution
      // would involve a dedicated 'adminOnly' flag in the authorize options.
      // For now, we'll use the existing isAdmin policy.
      fullUser.isAdmin = isAdmin(fullUser);
      return true; // Always return true for ownership as it's not a resource ownership check here
    },
  },
);
