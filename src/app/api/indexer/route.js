export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { withApiHardening } from '@/lib/api/hardening';
import { errorResponse } from '@/lib/api/errorResponse';
import { getDb } from "@/lib/mongodb";
import {
  runIndexerBatch,
  createJsonRpcEventSource,
} from "@/lib/indexer/stellarIndexer";
import {
  PURCHASE_MANAGER_CONTRACT_ID,
  MATERIAL_REGISTRY_CONTRACT_ID,
  STELLAR_RPC_URL,
  NETWORK_PASSPHRASE,
} from "@/lib/config/chain";

const INDEXER_SECRET = process.env.INDEXER_SECRET ?? "";
const BATCH_LIMIT = 100;

function isAuthorised(request) {
  if (!INDEXER_SECRET) return true;

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader === `Bearer ${INDEXER_SECRET}`) return true;

  const legacyHeader = request.headers.get("x-indexer-secret") ?? "";
  if (legacyHeader === INDEXER_SECRET) return true;

  return false;
}

export async function POST(request) {
  return withApiHardening(
    request,
    { route: 'indexer-post', rateLimit: { limit: 10, windowMs: 60_000 } },
    async () => {
      if (!isAuthorised(request)) {
        return errorResponse("Unauthorized", 401);
      }

      const contractIds = [
        PURCHASE_MANAGER_CONTRACT_ID,
        MATERIAL_REGISTRY_CONTRACT_ID,
      ].filter(Boolean);

      const eventSource = createJsonRpcEventSource({
        rpcUrl: STELLAR_RPC_URL,
        contractId: contractIds,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      let db;
      try {
        db = await getDb();
      } catch (err) {
        console.error("[indexer] DB connection failed:", err);
        return errorResponse("Database unavailable", 503);
      }

      try {
        const result = await runIndexerBatch({
          db,
          eventSource,
          source: "stellar",
          limit: BATCH_LIMIT,
        });

        console.log(
          `[indexer] batch complete — applied:${result.applied} skipped:${result.skipped} cursor:${result.nextCursor}`
        );

        return NextResponse.json({
          ok: true,
          applied: result.applied,
          skipped: result.skipped,
          nextCursor: result.nextCursor,
        });
      } catch (err) {
        console.error("[indexer] batch error:", err);
        return errorResponse(`Indexer batch failed: ${err.message}`, 500);
      }
    }
  );
}

export async function GET(request) {
  return withApiHardening(
    request,
    { route: 'indexer-get', rateLimit: { limit: 10, windowMs: 60_000 } },
    async () => {
      if (!isAuthorised(request)) {
        return errorResponse("Unauthorized", 401);
      }

      try {
        const db = await getDb();
        const state = await db
          .collection("sync_state")
          .findOne({ _id: "stellar:events" });

        return NextResponse.json({
          synced: !!state,
          cursor: state?.cursor ?? null,
          lastLedger: state?.lastLedger ?? null,
          updatedAt: state?.updatedAt ?? null,
        });
      } catch (err) {
        return errorResponse("Failed to read sync state", 500);
      }
    }
  );
}