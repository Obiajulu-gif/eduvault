import assert from "node:assert/strict";
import { test } from "node:test";

import { checkRateLimit, hashedDimension, resetRateLimits } from "../../src/lib/api/rateLimit.js";

/**
 * The rate limiter moved from a module-local Map to a Redis-backed counter
 * (#58), which made `checkRateLimit` async. The previous test still called it
 * synchronously and read `.allowed` off the returned Promise, so it asserted
 * `undefined === true` and had been failing ever since.
 *
 * Redis is not available in unit tests, so what is verifiable here is the
 * behaviour when it is unreachable — which is the security-relevant half:
 * whether an outage fails open or closed.
 */

test("fails closed when Redis is unreachable", async () => {
  resetRateLimits();

  const result = await checkRateLimit("profile:local", { limit: 2 });

  assert.equal(result.allowed, false, "an unreachable limiter must not admit traffic by default");
  assert.equal(result.degraded, true);
  assert.equal(result.remaining, 0);
  assert.ok(result.retryAfter >= 1);
});

test("fails open only when the caller explicitly opts in", async () => {
  resetRateLimits();

  const result = await checkRateLimit("profile:local", { limit: 5, outagePolicy: "open" });

  assert.equal(result.allowed, true);
  assert.equal(result.degraded, true, "an opt-in open failure must still be reported as degraded");
  assert.equal(result.limit, 5);
});

test("hashedDimension does not leak the raw identifier", () => {
  const address = "GBUYER0000000000000000000000000000000000000000000000000A";
  const hashed = hashedDimension(address);

  assert.equal(hashed.length, 32);
  assert.match(hashed, /^[0-9a-f]{32}$/);
  assert.ok(!hashed.includes(address));
  assert.equal(hashed, hashedDimension(address), "hashing must be stable across calls");
  assert.notEqual(hashed, hashedDimension("GOTHER"), "distinct dimensions must not collide");
});

test("missing and empty dimensions collapse to a single anonymous bucket", () => {
  assert.equal(hashedDimension(undefined), hashedDimension("anonymous"));
  assert.equal(hashedDimension(""), hashedDimension("anonymous"));
});
