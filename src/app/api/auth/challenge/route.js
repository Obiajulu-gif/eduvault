export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { issueChallenge } from "@/lib/auth/challenge";
import { normalizeWalletAddress } from "@/lib/api/validation";
import { withApiHardening } from "@/lib/api/hardening";
import { errorResponse } from "@/lib/api/errorResponse";

export async function GET(request) {
  return withApiHardening(
    request,
    { route: "auth-challenge", rateLimit: { limit: 5, windowMs: 60_000 } },
    async () => {
      try {
        const { searchParams } = new URL(request.url);
        const address = normalizeWalletAddress(searchParams.get("address"));

        if (!address) {
          return errorResponse("Missing or invalid address", 400);
        }

        const challenge = await issueChallenge(address);
        return NextResponse.json(challenge);
      } catch (error) {
        return errorResponse("Server error", 500);
      }
    }
  );
}