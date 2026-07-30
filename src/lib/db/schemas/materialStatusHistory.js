/**
 * Immutable transition history for the material lifecycle state machine.
 * One document per successful status transition (see src/lib/materials/materialLifecycle.js).
 * Used for documentation, type parsing, and runtime verification.
 */
export const MaterialStatusHistorySchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["materialId", "previousStatus", "nextStatus", "createdAt"],
      properties: {
        materialId: {
          bsonType: "string",
          description: "Identifier of the material this transition applies to",
        },
        actor: {
          bsonType: ["string", "null"],
          description: "Wallet address or user id of the actor who performed the transition",
        },
        previousStatus: {
          bsonType: "string",
          description: "Status the material transitioned from",
        },
        nextStatus: {
          bsonType: "string",
          description: "Status the material transitioned to",
        },
        reason: {
          bsonType: ["string", "null"],
          description: "Optional caller-supplied reason for the transition",
        },
        createdAt: {
          bsonType: "date",
          description: "Timestamp the transition was recorded",
        },
      },
    },
  },
};
