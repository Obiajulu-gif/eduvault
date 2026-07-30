import { NextResponse } from 'next/server';
import { verifyRefundLimit } from '@/lib/checkout/refundVerifier';
import logger from '@/lib/logger';
import { auditLog } from '@/lib/api/audit';
import { withAuthorization } from "@/lib/auth/authorize";
import { isAdmin } from "@/lib/auth/policies";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { errorResponse } from "@/lib/api/errorResponse";

export const POST = withAuthorization(
  async (authorizedRequest) => {
    const { userId } = authorizedRequest;
    try {
      const body = await authorizedRequest.json();
      const { transactionId, refundAmount } = body;

      if (!transactionId || !refundAmount) {
        auditLog({
          event: 'refund_request_failed',
          route: 'checkout/refund',
          method: 'POST',
          status: 400,
          reason: 'Missing transactionId or refundAmount',
          actor: userId,
        });
        return errorResponse("Missing transactionId or refundAmount", 400);
      }

      const verification = await verifyRefundLimit(transactionId, refundAmount);

      if (!verification.valid) {
        auditLog({
          event: 'refund_request_failed',
          route: 'checkout/refund',
          method: 'POST',
          status: 400,
          reason: verification.reason,
          actor: userId,
        });
        return errorResponse(verification.reason, 400);
      }

      // If valid, proceed with refund processing logic (e.g., interacting with Stellar network)
      auditLog({
        event: 'refund_approved',
        transactionId,
        refundAmount,
        status: 'approved',
        actor: userId,
      });

      return NextResponse.json({ message: 'Refund validated successfully', data: verification.purchase });

    } catch (error) {
      logger.error({ err: error.message }, 'Failed to process refund request');
      auditLog({
        event: 'refund_request_error',
        route: 'checkout/refund',
        method: 'POST',
        status: 500,
        reason: error.message,
        actor: userId,
      });
      return errorResponse("Internal server error", 500);
    }
  },
  {
    checkOwnership: async (userId, fullUser, request) => {
      if (isAdmin(fullUser)) {
        return true; // Admins can initiate any refund
      }

      const body = await request.json();
      const transactionId = typeof body?.transactionId === "string" ? body.transactionId.trim() : "";

      if (!transactionId) {
        return false; // Cannot determine ownership without transactionId
      }

      const db = await getDb();
      const purchase = await db.collection("purchases").findOne({
        _id: new ObjectId(transactionId),
        buyerId: userId,
      });

      return !!purchase; // Only the buyer of the transaction can initiate a refund
    },
  }
);