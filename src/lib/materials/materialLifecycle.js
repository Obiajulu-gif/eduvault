/**
 * Material Lifecycle State Machine
 *
 * States
 * ──────
 *  draft      – created, editable, not visible in the marketplace
 *  published  – live and purchasable
 *  closed     – no longer accepting new purchases; existing entitlements unaffected
 *  canceled   – withdrawn before ever generating a purchase; terminal
 *
 * Allowed transitions
 * ────────────────────
 *  draft      → published   (owner, publishing checklist satisfied)
 *  draft      → canceled    (owner or admin)
 *  published  → closed      (owner or admin)
 *  published  → canceled    (owner or admin; only if no completed purchases exist)
 *
 * `closed` and `canceled` are terminal — there is no transition out of them.
 *
 * All writes go through transitionMaterialStatus() below, which:
 *   - validates the transition against ALLOWED_TRANSITIONS
 *   - is idempotent (repeating the current status is a no-op, not an error)
 *   - guards the update with the expected current status in the Mongo filter
 *     so concurrent requests cannot both "win" the same transition
 *   - records an immutable transition history entry
 */

import { getDb } from "@/lib/mongodb";
import { auditLog } from "@/lib/api/audit";
import { isReadyToPublish } from "@/lib/publishing/checklist";
import { COLLECTIONS } from "@/lib/backend/schemaContracts";
import { PURCHASE_STATES } from "@/lib/purchases/stateMachine";
import { MATERIAL_STATUS, ALLOWED_TRANSITIONS } from "./materialLifecycleConstants";

export { MATERIAL_STATUS };

export class MaterialLifecycleError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "MaterialLifecycleError";
    this.code = code;
  }
}

/** Maps a MaterialLifecycleError.code to the HTTP status a route should return. */
export const LIFECYCLE_ERROR_HTTP_STATUS = Object.freeze({
  not_found: 404,
  forbidden: 403,
  invalid_transition: 409,
  // Missing/incomplete input on the material itself is a client data problem.
  checklist_incomplete: 400,
  // Blocked by the state of another resource (e.g. existing purchases) — a
  // true conflict with the typed 409 the state machine must return.
  precondition_failed: 409,
  conflict: 409,
});

function assertTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new MaterialLifecycleError(
      `Transition ${from} → ${to} is not allowed`,
      "invalid_transition"
    );
  }
}

function currentStatus(material) {
  return material.status || MATERIAL_STATUS.DRAFT;
}

function isOwnerOrAdmin(material, actor) {
  if (actor?.role === "admin") return true;
  const owner = material.userAddress || material.ownerAddress;
  const actorAddress = actor?.walletAddress || actor?.address || actor?.id;
  return !!owner && !!actorAddress && String(owner).toLowerCase() === String(actorAddress).toLowerCase();
}

/**
 * Precondition checks per target status. Thrown errors carry the typed
 * "precondition_failed" code so routes can surface a 409 with the reason.
 */
async function assertPreconditions(db, material, toStatus) {
  if (toStatus === MATERIAL_STATUS.PUBLISHED) {
    const { ready, missingRequired } = isReadyToPublish(material);
    if (!ready) {
      throw new MaterialLifecycleError(
        `Cannot publish: required fields are missing (${missingRequired.join(", ")})`,
        "checklist_incomplete"
      );
    }
  }

  if (toStatus === MATERIAL_STATUS.CANCELED && currentStatus(material) === MATERIAL_STATUS.PUBLISHED) {
    const confirmedPurchaseCount = await db.collection(COLLECTIONS.purchases).countDocuments({
      materialId: String(material._id),
      status: PURCHASE_STATES.CONFIRMED,
    });
    if (confirmedPurchaseCount > 0) {
      throw new MaterialLifecycleError(
        "Cannot cancel a published material that already has completed purchases; close it instead",
        "precondition_failed"
      );
    }
  }
}

/**
 * Core transition entry point used by every write path (publish/close/cancel routes).
 * Returns { material, alreadyInStatus, previousStatus }.
 */
export async function transitionMaterialStatus({ materialId, actor, toStatus, reason = null, extraFields = {} }) {
  if (!Object.values(MATERIAL_STATUS).includes(toStatus)) {
    throw new MaterialLifecycleError(`Unknown target status: ${toStatus}`, "invalid_transition");
  }

  const db = await getDb();
  const material = await db.collection(COLLECTIONS.materials).findOne({ _id: materialId });
  if (!material) {
    throw new MaterialLifecycleError("Material not found", "not_found");
  }

  if (!isOwnerOrAdmin(material, actor)) {
    throw new MaterialLifecycleError("Only the material owner or an admin can change its status", "forbidden");
  }

  const from = currentStatus(material);

  // Idempotent: repeating the current status is a no-op, not an error.
  if (from === toStatus) {
    return { material, alreadyInStatus: true, previousStatus: from };
  }

  assertTransition(from, toStatus);
  await assertPreconditions(db, material, toStatus);

  const now = new Date();
  const statusFilter =
    from === MATERIAL_STATUS.DRAFT
      ? { $or: [{ status: MATERIAL_STATUS.DRAFT }, { status: null }, { status: { $exists: false } }] }
      : { status: from };

  const updated = await db.collection(COLLECTIONS.materials).findOneAndUpdate(
    { _id: materialId, ...statusFilter },
    {
      $set: {
        status: toStatus,
        statusUpdatedAt: now,
        updatedAt: now,
        ...extraFields,
      },
    },
    { returnDocument: "after" }
  );

  if (!updated) {
    // Someone else changed the status between our read and write.
    throw new MaterialLifecycleError(
      `Material status changed concurrently; expected ${from}`,
      "conflict"
    );
  }

  await db.collection(COLLECTIONS.materialStatusHistory).insertOne({
    materialId: String(materialId),
    actor: actor?.walletAddress || actor?.address || actor?.id || actor?.sub || null,
    previousStatus: from,
    nextStatus: toStatus,
    reason,
    createdAt: now,
  });

  auditLog({
    event: "material_status_transitioned",
    actor: actor?.sub || actor?.id,
    materialId: String(materialId),
    fromStatus: from,
    toStatus,
    reason,
  });

  return { material: updated, alreadyInStatus: false, previousStatus: from };
}

export async function getMaterialStatusHistory(materialId) {
  const db = await getDb();
  return db
    .collection(COLLECTIONS.materialStatusHistory)
    .find({ materialId: String(materialId) })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function ensureMaterialLifecycleIndexes(db) {
  const col = db.collection(COLLECTIONS.materialStatusHistory);
  await col.createIndex({ materialId: 1, createdAt: -1 });
}
