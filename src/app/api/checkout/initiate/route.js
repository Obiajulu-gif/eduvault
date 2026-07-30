export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { findMaterial, verifyDiscount } from "@/lib/checkout/discountVerifier";
import { getTaxRateForCountry } from "@/lib/checkout/taxEstimator";
import {
  CheckoutIntentError,
  CHECKOUT_INTENT_ERROR_CODES,
  createSignedCheckoutIntent,
  percentToBasisPoints,
} from "@/lib/checkout/intent";
import { PURCHASE_MANAGER_CONTRACT_ID } from "@/lib/config/chain";
import { getDb } from "@/lib/mongodb";
import { getLatestManifest } from "@/lib/provenance/registry";
import { checkBuyerTrustline } from "@/lib/stellar/horizonClient";
import { withAuthorization } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/api/errorResponse";

const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
const PLATFORM_FEE_BPS = Number.parseInt(process.env.PLATFORM_FEE_BPS || "0", 10);

/**
 * POST /api/checkout/initiate
 *
 * Creates a server-authenticated checkout intent. The signed terms freeze the
 * buyer, material/version, seller, network, purchase contract, asset, integer
 * amount, fee breakdown, expiry, and nonce.
 */
export const POST = withAuthorization(
  async (authorizedRequest) => {
    const { userId } = authorizedRequest;

    try {
      const body = await authorizedRequest.json();
      const { materialId, asset, buyerCountry, discountCode } = body;

      if (!materialId) {
        return errorResponse("Missing materialId", 400);
      }

      if (!asset) {
        return errorResponse("Missing asset", 400);
      }

      if (!PURCHASE_MANAGER_CONTRACT_ID) {
        return errorResponse("Purchase manager contract is not configured", 500);
      }

      const db = await getDb();
      const material = await findMaterial(materialId, db);
      if (!material) {
        return errorResponse("Material not found", 404);
      }

      const buyerAddress = userId; // Use userId from authorizedRequest
      if (!buyerAddress) {
        return errorResponse("Missing buyer address", 400);
      }

      const assetCode = typeof asset === "string" ? asset : asset.code;
      const issuerAddress = typeof asset === "object" ? asset.issuer : undefined;
      const trustlineCheck = await checkBuyerTrustline(buyerAddress, assetCode, issuerAddress);
      if (!trustlineCheck.hasTrustline) {
        return errorResponse(trustlineCheck.instructions.message, 400);
      }

      let verifiedDiscount = null;
      let discountBps = 0;
      if (discountCode) {
        const discountResult = await verifyDiscount(discountCode, materialId, db);
        if (!discountResult.valid) {
          return errorResponse(discountResult.reason, 409);
        }
        verifiedDiscount = discountResult.discount;
        discountBps = percentToBasisPoints(discountResult.discountAmountPercent || 0);
      }

      let latestManifest = null;
      try {
        latestManifest = await getLatestManifest(materialId);
      } catch (error) {
        console.warn("[checkout/initiate] Failed to resolve latest manifest:", error?.message);
      }

      const signedIntent = createSignedCheckoutIntent({
        buyerAddress,
        materialId,
        material,
        materialVersion: latestManifest?.version || null,
        manifestDigest: latestManifest?.digest || null,
        sellerAddress: material.creatorAddress || material.userAddress || material.authorAddress || null,
        network: STELLAR_NETWORK,
        contractId: PURCHASE_MANAGER_CONTRACT_ID,
        asset,
        discountBps,
        taxBps: getTaxRateForCountry(buyerCountry),
        platformFeeBps: Number.isSafeInteger(PLATFORM_FEE_BPS) ? PLATFORM_FEE_BPS : 0,
      });

      const checkoutIntent = {
        ...signedIntent,
        materialId,
        buyerAddress: signedIntent.terms.buyer,
        status: "initiated",
        createdAt: new Date(signedIntent.terms.issuedAt),
        expiresAt: new Date(signedIntent.terms.expiry),
        consumedAt: null,
        discountCode: discountCode || null,
        discountPolicy: verifiedDiscount
          ? {
              id: String(verifiedDiscount._id || verifiedDiscount.id || discountCode),
              percentage: verifiedDiscount.percentage || 0,
              usageLimit: verifiedDiscount.usageLimit ?? null,
              usageCount: verifiedDiscount.usageCount ?? null,
            }
          : null,
      };

      const result = await db.collection("checkout_intents").insertOne(checkoutIntent);

      return NextResponse.json(
        {
          success: true,
          checkoutId: String(result.insertedId),
          checkout: {
            checkoutId: String(result.insertedId),
            intentHash: signedIntent.intentHash,
            signature: signedIntent.signature,
            terms: signedIntent.terms,
            expiresAt: signedIntent.terms.expiry,
            amount: signedIntent.terms.amount.display,
            amountUnits: signedIntent.terms.amount.units,
            asset: signedIntent.terms.asset,
            feeBreakdown: signedIntent.terms.feeBreakdown,
            discountCode: checkoutIntent.discountCode,
          },
        },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof CheckoutIntentError) {
        return errorResponse(err.message, err.status || 400);
      }

      console.error("POST /api/checkout/initiate error:", err);
      return errorResponse("Server error", 500);
    }
  },
  { checkOwnership: async () => true } // Any authenticated user can initiate a checkout
);

/**
 * GET /api/checkout/initiate
 *
 * Returns the deterministic tax rate that would be used for a signed intent.
 */
export const GET = withApiHardening(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const buyerCountry = searchParams.get("buyerCountry");

      return NextResponse.json({
        success: true,
        estimation: {
          taxRateBps: getTaxRateForCountry(buyerCountry),
        },
      });
    } catch (err) {
      console.error("GET /api/checkout/initiate error:", err);
      return errorResponse("Server error", 500);
    }
  },
  { route: "checkout-initiate-tax", rateLimit: { limit: 60, windowMs: 60_000 } }
);