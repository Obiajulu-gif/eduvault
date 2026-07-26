import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { MongoClient } from "mongodb";

import { checkDatabaseDrift } from "../../scripts/migrations/check-drift.mjs";
import { seedDatabase } from "../../scripts/seed-db.mjs";
import { COLLECTIONS } from "../../src/lib/backend/schemaContracts.js";
import { MIGRATIONS } from "../../src/lib/backend/migrations/registry.js";
import { calculateMigrationChecksum } from "../../src/lib/backend/migrations/migrationUtils.js";
import { closeMongoConnection } from "../../src/lib/mongodb.js";

const MONGODB_BASE_URI = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017";
const TEST_DB_NAME = "eduvault_schema_drift_test";
const TEST_MONGODB_URI = `${MONGODB_BASE_URI}/${TEST_DB_NAME}`;

function runMigrationProcess() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["scripts/migrations/migrate-db.mjs"],
      {
        cwd: path.resolve(import.meta.dirname, "../.."),
        env: {
          ...process.env,
          MONGODB_URI: TEST_MONGODB_URI,
          MONGODB_DB: TEST_DB_NAME,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });

    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Migration exited with code ${code}.\n${stdout}\n${stderr}`));
    });
    child.on("error", reject);
  });
}

test(
  "Schema Baseline and Drift Detection Suite",
  { timeout: 30_000 },
  async (context) => {
    process.env.MONGODB_URI = TEST_MONGODB_URI;
    process.env.MONGODB_DB = TEST_DB_NAME;

    const client = new MongoClient(TEST_MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    const db = client.db(TEST_DB_NAME);

    context.after(async () => {
      await db.dropDatabase();
      await client.close();
      await closeMongoConnection();
    });

    await db.dropDatabase();

    // 1. Verify fresh database fails drift check before migrations run
    const preMigrationCheck = await checkDatabaseDrift();
    assert.equal(
      preMigrationCheck.success,
      false,
      "Fresh database with no applied migrations should fail drift check"
    );
    await closeMongoConnection();

    // 2. Apply all migrations via CLI
    await runMigrationProcess();

    // 3. Verify post-migration database passes drift check cleanly
    const postMigrationCheck = await checkDatabaseDrift();
    assert.equal(
      postMigrationCheck.success,
      true,
      "Database after complete migration run must pass drift check with zero errors"
    );

    // 4. Verify checksum drift detection
    const migrationRecord = await db
      .collection(COLLECTIONS.schemaMigrations)
      .findOne({ version: 1 });
    assert.ok(migrationRecord, "Version 1 migration record should exist");

    await db.collection(COLLECTIONS.schemaMigrations).updateOne(
      { version: 1 },
      { $set: { checksum: "tampered_checksum_123" } }
    );

    await closeMongoConnection();
    const tamperedCheck = await checkDatabaseDrift();
    assert.equal(
      tamperedCheck.success,
      false,
      "Altered migration checksum must be caught by drift detection"
    );

    // Restore checksum
    const correctChecksum = calculateMigrationChecksum(MIGRATIONS[0]);
    await db.collection(COLLECTIONS.schemaMigrations).updateOne(
      { version: 1 },
      { $set: { checksum: correctChecksum } }
    );

    // 5. Test Seed Script & Production Safety Guard
    await seedDatabase();
    const seededUser = await db.collection(COLLECTIONS.users).findOne({ _id: "user_seed_creator_1" });
    assert.ok(seededUser, "Seed script should populate test users");

    // Test Production Safety Guard
    process.env.NODE_ENV = "production";
    await assert.rejects(
      async () => {
        await seedDatabase();
      },
      /SAFETY VIOLATION/,
      "Seed script must block execution when NODE_ENV === 'production'"
    );
    process.env.NODE_ENV = "test";
  }
);
