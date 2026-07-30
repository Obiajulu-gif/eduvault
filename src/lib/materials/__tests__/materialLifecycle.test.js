import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/audit", () => ({ auditLog: vi.fn() }));

/**
 * A minimal in-memory Mongo-like store with a genuinely atomic
 * findOneAndUpdate (check current state against the filter and set it in
 * one synchronous step), used to prove that concurrent transition attempts
 * only let one caller "win" — mirroring the real `{ _id, status: from }`
 * guarded update against a real MongoDB collection.
 */
function createFakeDb(seedDocs = {}) {
  const stores = new Map();
  for (const [collectionName, docs] of Object.entries(seedDocs)) {
    stores.set(collectionName, docs.map((d) => ({ ...d })));
  }

  function collection(name) {
    if (!stores.has(name)) stores.set(name, []);
    const docs = stores.get(name);

    function matches(doc, filter) {
      return Object.entries(filter).every(([key, value]) => {
        if (key === "$or") {
          return value.some((clause) => matches(doc, clause));
        }
        if (value && typeof value === "object" && "$exists" in value) {
          const exists = doc[key] !== undefined;
          return exists === value.$exists;
        }
        return doc[key] === value;
      });
    }

    return {
      async findOne(filter) {
        return docs.find((d) => matches(d, filter)) || null;
      },
      // Synchronous body so concurrent callers interleave only at the
      // `await` boundary, exactly like a single atomic Mongo operation.
      async findOneAndUpdate(filter, update) {
        const doc = docs.find((d) => matches(d, filter));
        if (!doc) return null;
        Object.assign(doc, update.$set);
        return { ...doc };
      },
      async insertOne(doc) {
        docs.push({ ...doc });
        return { insertedId: doc._id };
      },
      async countDocuments(filter) {
        return docs.filter((d) => matches(d, filter)).length;
      },
    };
  }

  return { collection, dump: (name) => stores.get(name) || [] };
}

let fakeDb;

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(async () => fakeDb),
}));

const { transitionMaterialStatus, MaterialLifecycleError, MATERIAL_STATUS } = await import(
  "../materialLifecycle.js"
);

const OWNER = "GOWNERADDRESS";
const actor = { walletAddress: OWNER };

function baseMaterial(overrides = {}) {
  return {
    _id: "mat_1",
    userAddress: OWNER,
    title: "A material",
    storageKey: "https://example.test/file.pdf",
    status: MATERIAL_STATUS.DRAFT,
    ...overrides,
  };
}

describe("materialLifecycle", () => {
  beforeEach(() => {
    fakeDb = createFakeDb();
  });

  it("publishes a draft with a satisfied checklist", async () => {
    fakeDb = createFakeDb({ materials: [baseMaterial()], material_status_history: [], purchases: [] });

    const result = await transitionMaterialStatus({
      materialId: "mat_1",
      actor,
      toStatus: MATERIAL_STATUS.PUBLISHED,
    });

    expect(result.material.status).toBe(MATERIAL_STATUS.PUBLISHED);
    expect(result.alreadyInStatus).toBe(false);
  });

  it("rejects publishing when the checklist is incomplete", async () => {
    fakeDb = createFakeDb({
      materials: [baseMaterial({ storageKey: undefined })],
      material_status_history: [],
    });

    await expect(
      transitionMaterialStatus({ materialId: "mat_1", actor, toStatus: MATERIAL_STATUS.PUBLISHED })
    ).rejects.toMatchObject({ code: "checklist_incomplete" });
  });

  it("rejects an invalid transition graph edge", async () => {
    fakeDb = createFakeDb({
      materials: [baseMaterial({ status: MATERIAL_STATUS.CANCELED })],
      material_status_history: [],
    });

    await expect(
      transitionMaterialStatus({ materialId: "mat_1", actor, toStatus: MATERIAL_STATUS.PUBLISHED })
    ).rejects.toMatchObject({ code: "invalid_transition" });
  });

  it("is idempotent when the target status equals the current status", async () => {
    fakeDb = createFakeDb({
      materials: [baseMaterial({ status: MATERIAL_STATUS.PUBLISHED })],
      material_status_history: [],
    });

    const result = await transitionMaterialStatus({
      materialId: "mat_1",
      actor,
      toStatus: MATERIAL_STATUS.PUBLISHED,
    });

    expect(result.alreadyInStatus).toBe(true);
    const history = await fakeDb.collection("material_status_history").findOne({});
    expect(history).toBeNull();
  });

  it("blocks canceling a published material with a confirmed purchase", async () => {
    fakeDb = createFakeDb({
      materials: [baseMaterial({ status: MATERIAL_STATUS.PUBLISHED })],
      material_status_history: [],
      purchases: [{ materialId: "mat_1", status: "confirmed" }],
    });

    await expect(
      transitionMaterialStatus({ materialId: "mat_1", actor, toStatus: MATERIAL_STATUS.CANCELED })
    ).rejects.toMatchObject({ code: "precondition_failed" });
  });

  it("rejects a caller who is neither the owner nor an admin", async () => {
    fakeDb = createFakeDb({ materials: [baseMaterial()], material_status_history: [] });

    await expect(
      transitionMaterialStatus({
        materialId: "mat_1",
        actor: { walletAddress: "GSOMEONEELSE" },
        toStatus: MATERIAL_STATUS.PUBLISHED,
      })
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("writes an immutable history entry with actor, previous/next status, and reason", async () => {
    fakeDb = createFakeDb({
      materials: [baseMaterial({ status: MATERIAL_STATUS.PUBLISHED })],
      material_status_history: [],
      purchases: [],
    });

    await transitionMaterialStatus({
      materialId: "mat_1",
      actor,
      toStatus: MATERIAL_STATUS.CLOSED,
      reason: "seasonal listing ended",
    });

    const history = await fakeDb.collection("material_status_history").findOne({ materialId: "mat_1" });
    expect(history).toMatchObject({
      materialId: "mat_1",
      actor: OWNER,
      previousStatus: MATERIAL_STATUS.PUBLISHED,
      nextStatus: MATERIAL_STATUS.CLOSED,
      reason: "seasonal listing ended",
    });
    expect(history.createdAt).toBeInstanceOf(Date);
  });

  it("only lets one of several concurrent transition attempts commit", async () => {
    fakeDb = createFakeDb({
      materials: [baseMaterial({ status: MATERIAL_STATUS.PUBLISHED })],
      material_status_history: [],
      purchases: [],
    });

    const attempts = await Promise.allSettled([
      transitionMaterialStatus({ materialId: "mat_1", actor, toStatus: MATERIAL_STATUS.CLOSED }),
      transitionMaterialStatus({ materialId: "mat_1", actor, toStatus: MATERIAL_STATUS.CLOSED }),
      transitionMaterialStatus({ materialId: "mat_1", actor, toStatus: MATERIAL_STATUS.CLOSED }),
    ]);

    const committed = attempts.filter((a) => a.status === "fulfilled" && !a.value.alreadyInStatus);
    const conflicted = attempts.filter(
      (a) => a.status === "rejected" && a.reason instanceof MaterialLifecycleError && a.reason.code === "conflict"
    );

    // Exactly one attempt performs the real transition; the others lose the
    // atomic race and are told so via a typed conflict, not silently ignored.
    expect(committed).toHaveLength(1);
    expect(conflicted).toHaveLength(2);
    expect(fakeDb.dump("materials")[0].status).toBe(MATERIAL_STATUS.CLOSED);
    expect(fakeDb.dump("material_status_history")).toHaveLength(1);
  });
});
