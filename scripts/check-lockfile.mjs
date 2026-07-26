#!/usr/bin/env node
/**
 * Lockfile integrity gate.
 *
 * Two failure modes this catches, both of which were live in this repo:
 *
 * 1. `package-lock.json` out of sync with `package.json`. Every workflow ran
 *    `npm install`, which silently rewrites the lockfile to match rather than
 *    failing, so the drift was invisible in CI while `npm ci` — the command a
 *    fresh clone or a production build actually uses — failed outright.
 *
 * 2. Competing lockfiles. `bun.lock` and `pnpm-lock.yaml` were committed
 *    alongside `package-lock.json` and last updated months earlier, so which
 *    dependency tree you got depended on which tool you happened to run.
 *
 * Exits non-zero with a fix instruction rather than a stack trace, since this
 * runs as a required check and the person reading the output is usually
 * looking for the one command that unblocks them.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_LOCKFILE = "package-lock.json";
const FOREIGN_LOCKFILES = ["bun.lock", "bun.lockb", "pnpm-lock.yaml", "yarn.lock"];

const problems = [];

function fail(summary, fix) {
  problems.push({ summary, fix });
}

function reportAndExit() {
  if (problems.length > 0) {
    console.error("Lockfile integrity check failed.\n");
    for (const [index, { summary, fix }] of problems.entries()) {
      console.error(`  ${index + 1}. ${summary}`);
      console.error(`     Fix: ${fix}\n`);
    }
    process.exit(1);
  }

  console.log(
    `Lockfile integrity OK (${CANONICAL_LOCKFILE} satisfies package.json; no competing lockfiles).`,
  );
  process.exit(0);
}

// --- 1. The canonical lockfile must exist and be committed -----------------

if (!existsSync(resolve(repoRoot, CANONICAL_LOCKFILE))) {
  fail(
    `${CANONICAL_LOCKFILE} is missing.`,
    "Run `npm install` and commit the generated lockfile.",
  );
}

// --- 2. No competing lockfiles ---------------------------------------------

const foreign = FOREIGN_LOCKFILES.filter((name) => existsSync(resolve(repoRoot, name)));
if (foreign.length > 0) {
  fail(
    `Found lockfiles for other package managers: ${foreign.join(", ")}.`,
    `This project standardises on npm (see the "packageManager" field). Delete ${foreign.join(" and ")}, or change the standard deliberately and update this check.`,
  );
}

// --- 3. The declared package manager must be npm ---------------------------

const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
if (!pkg.packageManager) {
  fail(
    'package.json has no "packageManager" field.',
    'Add e.g. "packageManager": "npm@10.9.4" so CI and contributors resolve the same tool.',
  );
} else if (!pkg.packageManager.startsWith("npm@")) {
  fail(
    `package.json declares "${pkg.packageManager}" but this check enforces npm.`,
    "Update this script if the project intentionally moved off npm.",
  );
}

// --- 4. The lockfile must satisfy package.json -----------------------------

// `npm ci --dry-run` is the cheapest faithful reproduction of what a fresh
// clone does: it reads both files and refuses to proceed when they disagree,
// without touching node_modules.
if (problems.length === 0) {
  try {
    const args = ["ci", "--dry-run", "--ignore-scripts", "--no-audit", "--no-fund"];

    // Invoke npm's CLI through the current Node binary rather than the `npm`
    // shim. Node 22+ refuses to spawn Windows `.cmd` files without a shell
    // (EINVAL), and `shell: true` would concatenate arguments unescaped.
    // `npm_execpath` is set by npm whenever this runs as an npm script.
    const npmCli = process.env.npm_execpath;
    if (npmCli && npmCli.endsWith(".js")) {
      execFileSync(process.execPath, [npmCli, ...args], { cwd: repoRoot, stdio: "pipe" });
    } else {
      execFileSync("npm", args, { cwd: repoRoot, stdio: "pipe" });
    }
  } catch (error) {
    // A spawn failure is an environment problem, not lockfile drift. Treating
    // the two alike would make this check fail for the wrong reason and send
    // the reader off to regenerate a lockfile that was never broken.
    if (error.code === "ENOENT" || error.code === "EINVAL") {
      fail(
        `Could not run \`npm ci --dry-run\` (${error.code}).`,
        "Run this check via `npm run check:lockfile` so npm's CLI path is available, and ensure npm is on PATH.",
      );
      reportAndExit();
    }

    const output = `${error.stdout || ""}${error.stderr || ""}`;
    const missing = [...output.matchAll(/Missing: (\S+) from lock file/g)].map((m) => m[1]);
    const invalid = [...output.matchAll(/Invalid: lock file's (\S+) does not satisfy (\S+)/g)]
      .map((m) => `${m[1]} does not satisfy ${m[2]}`);

    const detail = [
      missing.length > 0 ? `missing from lockfile: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ` (+${missing.length - 10} more)` : ""}` : null,
      invalid.length > 0 ? `version mismatches: ${invalid.slice(0, 10).join(", ")}` : null,
    ].filter(Boolean).join("; ");

    fail(
      `${CANONICAL_LOCKFILE} is out of sync with package.json${detail ? ` (${detail})` : ""}.`,
      "Run `npm install --package-lock-only` and commit the updated lockfile.",
    );
  }
}

// --- Report ----------------------------------------------------------------

reportAndExit();
