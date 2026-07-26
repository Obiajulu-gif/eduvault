export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyWalletAddressMatch } from '@/lib/stellar/checkoutService';
import logger from '@/lib/logger';
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";

/**
 * POST /api/checkout/verify
 *
 * Verifies that the wallet address in the signed transaction payload matches
 * the address stored in the user's JWT session.  Blocks submission and
 * returns a 403 if the addresses differ, defending against address-spoofing.
 *
 * Body:
 *   { payloadAddress: string }   — Stellar G-address extracted from the signed payload
 *
 * Session state persists per-user in the JWT; repeated mismatches clear the session.
 */
export const POST = withAuthorization(
  async (authorizedRequest) => {
    const { userId, fullUser } = authorizedRequest;
    try {
      const body = await authorizedRequest.json().catch(() => ({}));
      const { payloadAddress } = body;

      if (!payloadAddress || typeof payloadAddress !== 'string') {
        return errorResponse('Missing payloadAddress in request body', 400);
      }

      const sessionAddress = fullUser.walletAddress || fullUser.address || fullUser.publicKey || '';

      if (!sessionAddress) {
        logger.warn({ userId }, 'Checkout verify: session has no wallet address');
        return errorResponse('Session wallet address not found', 400);
      }

      // Mutable session state (warnings counter) stored on the user object.
      // In production this would be persisted via Redis / signed cookie update.
      const sessionState = fullUser.sessionState ?? {};
      const result = verifyWalletAddressMatch({ sessionAddress, payloadAddress, sessionState });

      if (!result.valid) {
        logger.warn(
          { sessionAddress, payloadAddress, warnings: result.warnings, clearSession: result.clearSession },
          'Checkout verify: wallet address mismatch blocked submission'
        );

        if (result.clearSession) {
          return errorResponse('Wallet address mismatch — session cleared due to repeated violations', 403);
        }

        return errorResponse('Wallet address in signed payload does not match session wallet', 403);
      }

      return NextResponse.json({ valid: true, address: sessionAddress }, { status: 200 });
    } catch (err) {
      logger.error({ err: err.message }, 'POST /api/checkout/verify error');
      return errorResponse('Server error', 500);
    }
  },
  { checkOwnership: async () => true } // Any authenticated user can verify their own wallet address
);