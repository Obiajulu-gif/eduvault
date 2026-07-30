import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getPurchaseStatus } from "@/lib/indexer";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";
import { withApiHardening } from "@/lib/api/hardening";

export const runtime = "nodejs";

export async function GET(request, context) {
  return withApiHardening(
    request,
    { route: "material-access", rateLimit: { limit: 60, windowMs: 60_000 } },
    async () => {
      return withAuthorization(async (authReq) => {
        const walletAddress =
          authReq.fullUser?.walletAddress || authReq.userId || request.headers?.get?.("x-user-wallet");

        const id = context?.params?.id;
        const db = await getDb();

        const material = await db.collection("materials").findOne({ _id: id });
        if (!material) {
          return errorResponse("Material not found", 404);
        }

        // Call our mocked Soroban indexer to verify on-chain entitlement
        const status = await getPurchaseStatus(walletAddress, id);

        if (status === "available") {
          return NextResponse.json(
            {
              status: "available",
              accessGranted: true,
              downloadUrl: `https://eduvault.test/downloads/signed/${id}`,
            },
            { status: 200 }
          );
        }

        return NextResponse.json({ status, accessGranted: false }, { status: 200 });
      })(request, context);
    }
  );
}