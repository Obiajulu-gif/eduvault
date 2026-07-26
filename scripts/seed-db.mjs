import process from "node:process";
import { closeMongoConnection, getDb } from "../src/lib/mongodb.js";
import { COLLECTIONS } from "../src/lib/backend/schemaContracts.js";

/**
 * Deterministic Database Seed Script
 *
 * Populates test/development environment with deterministic seed data for users,
 * materials, purchases, escrows, milestones, payouts, and support tickets.
 * Includes safety guards to prevent accidental execution against production.
 */
export async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI || "";
  const nodeEnv = process.env.NODE_ENV || "development";

  // Production Safety Guard
  if (
    nodeEnv === "production" ||
    mongoUri.includes("prod") ||
    (mongoUri.includes("mongodb.net") && !process.env.ALLOW_PRODUCTION_SEED)
  ) {
    throw new Error(
      "SAFETY VIOLATION: Cannot run seed script against production database without ALLOW_PRODUCTION_SEED=true"
    );
  }

  console.log("[seed] Starting deterministic database seeding...");

  const db = await getDb();

  // 1. Seed Users
  const seedUsers = [
    {
      _id: "user_seed_creator_1",
      fullName: "Alice Creator",
      email: "alice.creator@example.com",
      walletAddress: "GBXSK7R3QJ4N5B6C7D8E9F0A1B2C3D4E5F6G7H8I9J0K",
      walletAddressLower: "gbxsk7r3qj4n5b6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k",
      role: "creator",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
    {
      _id: "user_seed_learner_1",
      fullName: "Bob Learner",
      email: "bob.learner@example.com",
      walletAddress: "GCDXSK7R3QJ4N5B6C7D8E9F0A1B2C3D4E5F6G7H8I9J0K",
      walletAddressLower: "gcdxsk7r3qj4n5b6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k",
      role: "learner",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
  ];

  for (const user of seedUsers) {
    await db.collection(COLLECTIONS.users).updateOne(
      { _id: user._id },
      { $set: user },
      { upsert: true }
    );
  }

  // 2. Seed Materials
  const seedMaterials = [
    {
      _id: "mat_seed_001",
      materialId: "mat_seed_001",
      title: "Introduction to Soroban Smart Contracts",
      description: "Comprehensive guide to smart contract development on Stellar.",
      userAddress: "GBXSK7R3QJ4N5B6C7D8E9F0A1B2C3D4E5F6G7H8I9J0K",
      ownerAddress: "GBXSK7R3QJ4N5B6C7D8E9F0A1B2C3D4E5F6G7H8I9J0K",
      status: "published",
      visibility: "public",
      price: 15.5,
      ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      category: "Blockchain",
      createdAt: new Date("2026-01-02T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    },
  ];

  for (const material of seedMaterials) {
    await db.collection(COLLECTIONS.materials).updateOne(
      { _id: material._id },
      { $set: material },
      { upsert: true }
    );
  }

  // 3. Seed Purchases
  const seedPurchases = [
    {
      _id: "purchase_seed_001",
      materialId: "mat_seed_001",
      buyerAddress: "GCDXSK7R3QJ4N5B6C7D8E9F0A1B2C3D4E5F6G7H8I9J0K",
      status: "confirmed",
      chainTxHash: "0xseedtxhash1234567890abcdef1234567890abcdef1234567890abcdef12345678",
      amount: 15.5,
      createdAt: new Date("2026-01-03T00:00:00Z"),
      updatedAt: new Date("2026-01-03T00:00:00Z"),
    },
  ];

  for (const purchase of seedPurchases) {
    await db.collection(COLLECTIONS.purchases).updateOne(
      { _id: purchase._id },
      { $set: purchase },
      { upsert: true }
    );
  }

  // 4. Seed Escrows & Milestones
  const seedEscrows = [
    {
      _id: "escrow_seed_001",
      escrowId: "escrow_seed_001",
      contractId: "C1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
      engager: "GCDXSK7R3QJ4N5B6C7D8E9F0A1B2C3D4E5F6G7H8I9J0K",
      amount: "100.00",
      status: "funded",
      createdAt: new Date("2026-01-04T00:00:00Z"),
      updatedAt: new Date("2026-01-04T00:00:00Z"),
    },
  ];

  for (const escrow of seedEscrows) {
    await db.collection(COLLECTIONS.escrows).updateOne(
      { _id: escrow._id },
      { $set: escrow },
      { upsert: true }
    );
  }

  const seedMilestones = [
    {
      _id: "milestone_seed_001",
      milestoneId: "milestone_seed_001",
      escrowId: "escrow_seed_001",
      description: "Initial Draft Submission",
      amount: "50.00",
      status: "completed",
      createdAt: new Date("2026-01-04T00:00:00Z"),
      updatedAt: new Date("2026-01-04T00:00:00Z"),
    },
  ];

  for (const milestone of seedMilestones) {
    await db.collection(COLLECTIONS.milestones).updateOne(
      { _id: milestone._id },
      { $set: milestone },
      { upsert: true }
    );
  }

  console.log("[seed] Seeding completed successfully.");
}

if (process.argv[1] && process.argv[1].endsWith("seed-db.mjs")) {
  seedDatabase()
    .then(() => {
      console.log("[seed] Done.");
    })
    .catch((error) => {
      console.error("[seed] Seeding failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closeMongoConnection();
    });
}
