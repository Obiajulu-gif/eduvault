#!/usr/bin/env node
/**
 * Preview-deployment smoke tests.
 *
 * Runs a handful of black-box checks against a already-deployed preview URL
 * (Vercel preview, a locally started `next start`, etc.). It never imports app
 * code and never touches production resources — it only makes HTTP requests to
 * the URL in $SMOKE_BASE_URL — so it is safe to run against fork PRs without
 * handing them any secrets.
 *
 * The three checks map to the acceptance criteria:
 *   1. Landing page renders.
 *   2. Authentication boundary rejects an unauthenticated protected request.
 *   3. One API health path is live.
 *
 * Usage:
 *   SMOKE_BASE_URL=https://preview-xyz.vercel.app npm run test:smoke
 *
 * Exit code is non-zero if any check fails, so it can gate a deploy.
 */

const baseUrl = (process.env.SMOKE_BASE_URL || process.env.PREVIEW_URL || "").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 15000);

if (!baseUrl) {
  console.error("SMOKE_BASE_URL is required (the deployed preview URL to test against).");
  process.exit(2);
}

async function request(path, { method = "GET" } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      redirect: "manual",
      headers: { "user-agent": "eduvault-smoke/1.0" },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

const checks = [
  {
    name: "landing page renders",
    async run() {
      const res = await request("/");
      // A preview may redirect the bare root; both a 200 and a redirect to a
      // real page count as "the app is serving", a 5xx does not.
      if (res.status >= 500) throw new Error(`expected the landing page to serve, got ${res.status}`);
      if (res.status >= 400 && res.status !== 401) throw new Error(`landing page returned ${res.status}`);
      return `status ${res.status}`;
    },
  },
  {
    name: "authentication boundary rejects an unauthenticated protected request",
    async run() {
      // No cookie is sent, so a protected route must refuse. A 200 here would
      // mean the auth boundary is open on the preview, which is the single
      // most important thing this stage can catch.
      const res = await request("/api/purchased-materials");
      if (res.status !== 401 && res.status !== 403) {
        throw new Error(`expected 401/403 without a session, got ${res.status}`);
      }
      return `status ${res.status}`;
    },
  },
  {
    name: "API health path is live",
    async run() {
      const res = await request("/api/health");
      if (res.status !== 200) throw new Error(`expected 200 from /api/health, got ${res.status}`);
      const body = await res.json().catch(() => ({}));
      if (body.status !== "alive") throw new Error(`expected {status:"alive"}, got ${JSON.stringify(body)}`);
      return `status 200, alive`;
    },
  },
];

console.log(`Smoke testing ${baseUrl}\n`);

let failed = 0;
for (const check of checks) {
  try {
    const detail = await check.run();
    console.log(`  ✓ ${check.name} (${detail})`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${check.name}: ${error.message}`);
  }
}

console.log("");
if (failed > 0) {
  console.error(`${failed} of ${checks.length} smoke checks failed.`);
  process.exit(1);
}
console.log(`All ${checks.length} smoke checks passed.`);
