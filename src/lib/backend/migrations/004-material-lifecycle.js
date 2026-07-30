import { COLLECTIONS, REQUIRED_INDEXES } from "../schemaContracts.js";
import { runInBatches } from "./migrationUtils.js";
import { MATERIAL_STATUS } from "../../materials/materialLifecycleConstants.js";

async function collectionExists(db, collectionName) {
  const collections = await db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();
  return collections.length > 0;
}

async function ensureCollection(db, collectionName) {
  if (await collectionExists(db, collectionName)) return;
  await db.createCollection(collectionName);
}

async function createIndexes(db, collectionName, indexDefinitions) {
  if (!indexDefinitions?.length) return;
  const models = indexDefinitions.map((definition) => ({
    key: definition.keys,
    name: definition.name,
    ...definition.options,
  }));
  await db.collection(collectionName).createIndexes(models);
}

/**
 * Backfills the explicit `status` field for materials that predate the
 * lifecycle state machine, inferring it from existing signals so that no
 * material's effective (observable) status changes:
 *   - has a publishedAt timestamp (or status already "published")  -> published
 *   - otherwise                                                    -> draft
 * Materials that already carry an explicit status are left untouched.
 */
async function backfillMaterialStatus({ db, logger = console }) {
  const collection = db.collection(COLLECTIONS.materials);

  const processed = await runInBatches({
    collection,
    filter: { status: { $exists: false } },
    migrationVersion: 4,
    logger,
    transform: async (doc) => {
      const inferredStatus = doc.publishedAt || doc.visibility === "public"
        ? MATERIAL_STATUS.PUBLISHED
        : MATERIAL_STATUS.DRAFT;

      return {
        $set: {
          status: inferredStatus,
          statusUpdatedAt: doc.publishedAt || doc.updatedAt || doc.createdAt || new Date(),
        },
      };
    },
  });

  logger.info?.("[migration:004] Material status backfill completed", { processed });
}

const migration = {
  version: 4,
  name: "material-lifecycle",
  description:
    "Adds the material_status_history collection for the material lifecycle state machine and backfills a missing status field on legacy materials without changing their current effective status.",

  async up({ db, logger = console }) {
    await ensureCollection(db, COLLECTIONS.materialStatusHistory);
    await createIndexes(
      db,
      COLLECTIONS.materialStatusHistory,
      REQUIRED_INDEXES[COLLECTIONS.materialStatusHistory]
    );

    logger.info?.("[migration:004] material_status_history collection ensured");

    await backfillMaterialStatus({ db, logger });
  },

  async down({ db, logger = console }) {
    // Deliberately conservative: leave backfilled status fields in place
    // (removing them could re-introduce ambiguity for already-migrated data).
    logger.info?.("[migration:004] No-op rollback (status backfill is not reverted)");
  },
};

export default migration;
