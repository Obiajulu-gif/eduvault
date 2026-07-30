import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auditLog } from "@/lib/api/audit";
import { withAuthorization } from "@/lib/auth/authorize";
import { isAdmin } from "@/lib/auth/policies";
import { errorResponse } from "@/lib/api/errorResponse";

export const POST = withAuthorization(
  async (request) => {
    try {
      const { userId } = request;
      const body = await request.json();
      const { applicationId, action } = body;

      if (!applicationId || !["approve", "reject"].includes(action)) {
        return errorResponse(
          "applicationId and valid action (approve/reject) are required",
          400
        );
      }

      const db = await getDb();
      const applications = db.collection("verification_applications");
      const profiles = db.collection("profiles");

      const application = await applications.findOne({ _id: applicationId });
      if (!application) {
        return errorResponse("Application not found", 404);
      }

      if (application.status !== "pending") {
        return errorResponse(
          `Application is already ${application.status}`,
          400
        );
      }

      const newStatus = action === "approve" ? "approved" : "rejected";
      const updateFields = {
        status: newStatus,
        reviewedBy: userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      };

      await applications.updateOne(
        { _id: applicationId },
        { $set: updateFields }
      );

      if (action === "approve") {
        await profiles.updateOne(
          { uuid: application.userUuid },
          {
            $set: {
              profileType: application.requestedType || "institution",
              verifiedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );
      }

      auditLog({
        event: `admin_verification_${action}`,
        route: "admin/verification",
        method: "POST",
        status: 200,
        actor: userId,
        materialId: applicationId,
      });

      return NextResponse.json({ success: true, status: newStatus });
    } catch (error) {
      console.error("[admin/verification] POST error:", error);
      return errorResponse(error.message || "Internal Server Error", 500);
    }
  },
  {
    checkOwnership: async (userId, fullUser) => {
      return isAdmin(fullUser);
    },
  }
);

export const GET = withAuthorization(
  async (request) => {
    try {
      const db = await getDb();
      const applications = await db
        .collection("verification_applications")
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return NextResponse.json({ applications });
    } catch (error) {
      console.error("[admin/verification] GET error:", error);
      return errorResponse("Internal Server Error", 500);
    }
  },
  {
    checkOwnership: async (userId, fullUser) => {
      return isAdmin(fullUser);
    },
  }
);