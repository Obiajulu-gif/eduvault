export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { withApiHardening } from "@/lib/api/hardening";
import { errorResponse } from "@/lib/api/errorResponse";

/**
 * POST /api/checkout/verify-promo
 *
 * Verifies a promo code and returns discount details.
 *
 * Body:
 *   { code: string, materialId?: string }
 *
 * Returns:
 *   { valid: true, code, discountPercent, discountLabel, expiresAt }
 *   or { valid: false, error: 'expired' | 'invalid_code' | ... }
 */
export const POST = withApiHardening(
  async (req) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { code, materialId } = body;

      if (!code || typeof code !== 'string') {
        return errorResponse('Promo code is required.', 400);
      }

    const normalizedCode = code.trim().toUpperCase();
    const db = await getDb();
    const promoCollection = db.collection('promo_codes');

    const promo = await promoCollection.findOne({ code: normalizedCode });

    if (!promo) {
      return errorResponse('Invalid promo code.', 400);
    }

    if (promo.active === false) {
      return errorResponse('This promo code is no longer active.', 400);
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return errorResponse('This promo code has expired.', 400);
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return errorResponse('This promo code has reached its usage limit.', 400);
    }

    // If materialId is provided, check if the promo is restricted to specific materials
    if (materialId && promo.materialIds && Array.isArray(promo.materialIds) && promo.materialIds.length > 0) {
      if (!promo.materialIds.includes(materialId)) {
        return errorResponse('This promo code is not valid for the selected item.', 400);
      }
    }

    const discountPercent = Number(promo.discountPercent) || 0;
    if (discountPercent <= 0 || discountPercent > 100) {
      return errorResponse('This promo code has an invalid discount value.', 400);
    }

    return NextResponse.json({
      valid: true,
      code: normalizedCode,
      discountPercent,
      discountLabel: promo.label || `${discountPercent}% off`,
      expiresAt: promo.expiresAt || null,
      maxUses: promo.maxUses || null,
      usedCount: promo.usedCount || 0,
    }, { status: 200 });
  } catch (err) {
    console.error('POST /api/checkout/verify-promo error:', err);
    return errorResponse('Server error', 500);
  }
},
{ route: "checkout-verify-promo", rateLimit: { limit: 60, windowMs: 60_000 } }
);