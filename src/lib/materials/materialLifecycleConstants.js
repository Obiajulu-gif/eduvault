/**
 * Pure lifecycle constants shared between the server-side state machine
 * (materialLifecycle.js) and client UI code. No server-only imports here so
 * this module is safe to use from "use client" components.
 */

export const MATERIAL_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  CANCELED: "canceled",
});

export const ALLOWED_TRANSITIONS = Object.freeze({
  [MATERIAL_STATUS.DRAFT]: [MATERIAL_STATUS.PUBLISHED, MATERIAL_STATUS.CANCELED],
  [MATERIAL_STATUS.PUBLISHED]: [MATERIAL_STATUS.CLOSED, MATERIAL_STATUS.CANCELED],
  [MATERIAL_STATUS.CLOSED]: [],
  [MATERIAL_STATUS.CANCELED]: [],
});

export function getAllowedNextStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus || MATERIAL_STATUS.DRAFT] || [];
}
