#!/usr/bin/env node
/**
 * Dependency license policy gate.
 *
 * Walks the installed production dependency tree (`npm ls --omit=dev --json`)
 * and flags any package whose license is on a denylist of strong-copyleft and
 * unlicensed terms that are incompatible with shipping a proprietary-by-default
 * Next.js service. This is a policy check, not legal advice: it exists so a
 * license change in a transitive dependency surfaces in review instead of at
 * audit time.
 *
 * Unknown or missing licenses are reported but do not fail the build by
 * default, because a handful of legitimately-licensed packages simply do not
 * declare terms in a machine-readable field. Pass --strict to fail on those
 * too. Genuinely denied licenses always fail.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

// SPDX identifiers we will not ship. Network-copyleft (AGPL) and strong
// copyleft (GPL, unmodified LGPL linkage concerns) are the material ones for a
// hosted service; the rest are non-open or ambiguous.
const DENYLIST = new Set([
  "AGPL-1.0", "AGPL-3.0", "AGPL-3.0-only", "AGPL-3.0-or-later",
  "GPL-1.0", "GPL-2.0", "GPL-3.0", "GPL-3.0-only", "GPL-3.0-or-later",
  "SSPL-1.0",
  "CC-BY-NC-4.0", "CC-BY-NC-SA-4.0",
  "BUSL-1.1",
  "UNLICENSED",
]);

// Packages consciously accepted despite a denied license. Keep this small and
// annotated. The two below are PRE-EXISTING transitive dependencies of core
// wallet integrations, surfaced when this gate was first introduced. They are
// allowlisted so the gate does not block on state that predates it, but they
// are unresolved and flagged for maintainer legal review — see the CI section
// of docs/ci-and-quality-gates.md. A NEW GPL/AGPL dependency will still fail.
const ALLOWLIST = new Set([
  // GPL-3.0 — transitive via @creit-tech/stellar-wallets-kit. NEEDS REVIEW.
  "@lobstrco/signer-extension-api@2.0.0",
  // AGPL-3.0-or-later — transitive via @trezor/connect and @rainbow-me/rainbowkit. NEEDS REVIEW.
  "ua-parser-js@2.0.10",
]);

/**
 * Installed filesystem paths of every production package.
 *
 * `--parseable` prints one path per line and is stable across npm versions,
 * unlike the `--json` tree whose node shape (and whether it carries `license`
 * or `path`) varies. `npm ls` exits non-zero on peer-dependency warnings even
 * when the listing is complete, so stdout is read regardless of exit code.
 */
function readInstalledPaths() {
  const npmCli = process.env.npm_execpath;
  const runner = npmCli && npmCli.endsWith(".js")
    ? [process.execPath, [npmCli, "ls", "--omit=dev", "--all", "--parseable"]]
    : ["npm", ["ls", "--omit=dev", "--all", "--parseable"]];

  let raw;
  try {
    raw = execFileSync(runner[0], runner[1], { cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EINVAL") {
      console.error(`Could not run \`npm ls\` (${error.code}). Run this via \`npm run check:licenses\`.`);
      process.exit(1);
    }
    raw = error.stdout;
    if (!raw) {
      console.error("Could not read the dependency tree via `npm ls`.");
      process.exit(1);
    }
  }

  return raw
    .toString()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("node_modules"));
}

const denied = [];
const unknown = [];
const seen = new Set();

function licenseFromManifest(manifest) {
  if (typeof manifest.license === "string") return manifest.license;
  if (manifest.license && typeof manifest.license === "object") return manifest.license.type || null;
  if (Array.isArray(manifest.licenses) && manifest.licenses[0]) return manifest.licenses[0].type || null;
  return null;
}

for (const pkgPath of readInstalledPaths()) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(resolve(pkgPath, "package.json"), "utf8"));
  } catch {
    continue; // Path without a readable manifest — not something to police.
  }

  if (!manifest.name || !manifest.version) continue;
  const id = `${manifest.name}@${manifest.version}`;
  if (seen.has(id) || ALLOWLIST.has(id)) continue;
  seen.add(id);

  const license = licenseFromManifest(manifest);
  if (!license) unknown.push(id);
  else if (DENYLIST.has(license)) denied.push({ id, license });
}

if (denied.length > 0) {
  console.error(`License policy: ${denied.length} denied package(s).\n`);
  for (const { id, license } of denied) console.error(`  ✗ ${id} — ${license}`);
  console.error("\nRemove the dependency, find an alternatively-licensed one, or, if legal review approves, add it to the annotated ALLOWLIST in this script.");
  process.exit(1);
}

if (unknown.length > 0) {
  const preview = unknown.slice(0, 20).join(", ");
  console.warn(`License policy: ${unknown.length} package(s) with no declared license: ${preview}${unknown.length > 20 ? " …" : ""}`);
  if (strict) {
    console.error("\n--strict: failing on undeclared licenses.");
    process.exit(1);
  }
}

console.log(`License policy OK: ${seen.size} production packages scanned, 0 denied.`);
