import process from "node:process";
import { closeMongoConnection, getDb } from "../../src/lib/mongodb.js";
import { COLLECTIONS, REQUIRED_INDEXES } from "../../src/lib/backend/schemaContracts.js";
import { MIGRATIONS, validateMigrationRegistry } from "../../src/lib/backend/migrations/registry.js";
import { calculateMigrationChecksum } from "../../src/lib/backend/migrations/migrationUtils.js";

/**
 * CI / Deployment Schema Drift Detection Script
 *
 * Verifies that:
 * 1. All registered migrations in MIGRATIONS have been applied to the database and match checksums.
 * 2. No unapplied or pending migrations exist.
 * 3. All required indexes for all collections exist with expected definitions.
 */
export async function checkDatabaseDrift() {
  console.log("[drift-check] Starting database schema and drift verification");

  validateMigrationRegistry();

  const db = await getDb();
  let driftCount = 0;
  const warnings = [];

  // 1. Verify Applied Migrations & Checksums
  const appliedMigrations = await db
    .collection(COLLECTIONS.schemaMigrations)
    .find({})
    .toArray();

  const appliedMap = new Map(appliedMigrations.map((m) => [m.version, m]));

  for (const migration of MIGRATIONS) {
    const applied = appliedMap.get(migration.version);
    const expectedChecksum = calculateMigrationChecksum(migration);

    if (!applied) {
      console.error(`[drift-check] UNAPPLIED MIGRATION: Version ${migration.version} (${migration.name}) is pending`);
      driftCount++;
    } else if (applied.status !== "completed") {
      console.error(
        `[drift-check] INCOMPLETE MIGRATION: Version ${migration.version} status is "${applied.status}"`
      );
      driftCount++;
    } else if (applied.checksum !== expectedChecksum) {
      console.error(
        `[drift-check] CHECKSUM DRIFT: Version ${migration.version} checksum mismatch (expected: ${expectedChecksum}, database: ${applied.checksum})`
      );
      driftCount++;
    }
  }

  // 2. Verify Database Indexes
  for (const [collectionName, requiredIndexes] of Object.entries(REQUIRED_INDEXES)) {
    let existingIndexes = [];
    try {
      existingIndexes = await db.collection(collectionName).indexes();
    } catch (err) {
      if (err.code === 26 || err.codeName === "NamespaceNotFound") {
        console.error(`[drift-check] MISSING COLLECTION: Collection "${collectionName}" does not exist`);
        driftCount++;
        continue;
      }
      throw err;
    }

    const existingIndexMap = new Map(existingIndexes.map((idx) => [idx.name, idx]));

    for (const requiredIndex of requiredIndexes) {
      const existing = existingIndexMap.get(requiredIndex.name);

      if (!existing) {
        console.error(
          `[drift-check] MISSING INDEX: ${collectionName}.${requiredIndex.name} is missing`
        );
        driftCount++;
        continue;
      }

      // Verify unique constraint if specified
      if (requiredIndex.options?.unique && !existing.unique) {
        console.error(
          `[drift-check] INDEX DRIFT: ${collectionName}.${requiredIndex.name} should be unique but is not`
        );
        driftCount++;
      }
    }
  }

  if (driftCount > 0) {
    console.error(`[drift-check] FAILED: Detected ${driftCount} database schema drift problem(s).`);
    return { success: false, driftCount, warnings };
  }

  console.log("[drift-check] SUCCESS: Database schema matches committed baseline with zero drift.");
  return { success: true, driftCount: 0, warnings };
}

if (process.argv[1] && process.argv[1].endsWith("check-drift.mjs")) {
  checkDatabaseDrift()
    .then((result) => {
      if (!result.success) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error("[drift-check] Fatal error during drift check:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closeMongoConnection();
    });
}
