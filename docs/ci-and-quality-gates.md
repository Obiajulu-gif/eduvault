# CI and Quality Gates

This document describes the continuous-integration gates that guard the
`main` and `develop` branches, which checks are required to merge, and the
emergency-bypass procedure. It is the reference for issue #101.

## Workflows

| Workflow | File | Trigger | Purpose |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | PRs, push to `main`/`develop` | Primary gate: clean install, lockfile integrity, license policy, lint, build, unit + integration tests, contract tests, migration validation |
| Backend CI | `backend.yml` | path-filtered PRs/push | Focused backend lint + build + test |
| Backend Integration Tests | `backend-tests.yml` | path-filtered PRs/push | Vitest integration suite |
| Frontend CI | `frontend.yml` | path-filtered PRs/push | Frontend lint + build |
| Contracts CI | `contracts.yml` | path-filtered PRs/push | Soroban + archived Solidity checks |
| Security Guardrails | `security.yml` | PRs, push to `main`/`develop` | Dependency audit + secret scan |
| Preview Smoke Tests | `preview-smoke.yml` | `deployment_status`, manual | Black-box checks against a deployed preview |
| MongoDB Backup | `backup.yml` | schedule, manual | Operational, not a gate |

All workflows declare `permissions: contents: read` (least privilege) and a
`concurrency` group. Feature branches cancel superseded runs;
`main`/`develop` never cancel, so every protected-branch commit records a
status. The backup workflow never cancels an in-flight run.

## What the CI workflow enforces

Run from a fresh clone, in order:

1. **Clean install** — `npm ci`, not `npm install`. This fails on lockfile
   drift instead of silently rewriting `package-lock.json`. A stale lockfile
   is a merge blocker, by design.
2. **Lockfile integrity** — `npm run check:lockfile`. Confirms
   `package-lock.json` satisfies `package.json` and that no competing
   `bun.lock` / `pnpm-lock.yaml` / `yarn.lock` has reappeared. npm is the one
   supported package manager (`packageManager` field in `package.json`).
3. **License policy** — `npm run check:licenses`. Fails on newly introduced
   GPL/AGPL/SSPL/unlicensed production dependencies. See "Known license
   exceptions" below.
4. **CI environment validation** — `npm run check:ci-env`.
5. **Lint** — `npm run lint` (ESLint via `eslint-config-next`). Errors block;
   warnings do not.
6. **Type-check (advisory)** — `npm run typecheck`. Reported, never blocking —
   see "Type-checking" below.
7. **Production build** — `npm run build`.
8. **Backend unit tests** — `npm run test:backend`.
9. **Integration tests** — `npm run test:integration`.
10. **Contract tests** — `npm run test:contracts`.
11. **Migration validation** — a separate job runs `npm run test:migrations`
    against a MongoDB service container, exercising the migrations forward
    against a real database.

### Fork pull requests run without secrets

The CI workflow uses only deliberately non-production environment values
(hostnames under `.invalid`, throwaway tokens). It requests no secrets and no
write permissions, so a pull request from a fork runs the entire suite with
nothing worth exfiltrating and no ability to push or comment. The preview
smoke workflow likewise only makes outbound HTTP requests to an already-public
preview URL — it never checks out untrusted code with elevated scope.

## Preview smoke tests

`preview-smoke.yml` runs `scripts/smoke-preview.mjs` against a deployed
preview. It verifies the three acceptance-criteria paths:

- the landing page serves (not a 5xx),
- the authentication boundary rejects an unauthenticated request to a
  protected route (`/api/purchased-materials` must return 401/403),
- one API health path is live (`/api/health` returns `{ status: "alive" }`).

It fires automatically on a successful `deployment_status` (e.g. a Vercel
preview), or manually via `workflow_dispatch` with a `base_url` input. Run it
locally with:

```bash
SMOKE_BASE_URL=https://your-preview.example npm run test:smoke
```

## Type-checking

The codebase is JavaScript with JSDoc annotations, not TypeScript. Running
`checkJs` over it reports several thousand findings, the overwhelming majority
of which are missing parameter annotations rather than defects. Making that a
blocking gate today would wall off every merge, so `npm run typecheck` runs in
CI as **advisory**: its output is surfaced as a warning and never fails the
build. The intent is to drive the number down deliberately (a typed-JSDoc
pass belongs in its own issue) and only then consider promoting it to a
required check.

## Known license exceptions

Two pre-existing transitive dependencies carry denied licenses and are
allowlisted in `scripts/check-licenses.mjs` with annotations:

- `@lobstrco/signer-extension-api` (GPL-3.0) — via `@creit-tech/stellar-wallets-kit`
- `ua-parser-js@2.0.10` (AGPL-3.0-or-later) — via `@trezor/connect` and `@rainbow-me/rainbowkit`

These predate the license gate and are flagged for maintainer legal review;
they are allowlisted so the gate does not block on state that existed before
it. **A newly added** GPL/AGPL/SSPL dependency still fails the check.

## Required checks (branch protection)

Recommended required status checks for `main` and `develop`:

- `CI / Lint, build, and test`
- `CI / Migration validation`
- `Security Guardrails / Dependency And Secret Checks`

The path-filtered `backend` / `frontend` / `contracts` workflows are useful
signal but should not be required, because a PR that does not touch their
paths never triggers them and would otherwise sit forever "expected —
waiting for status". Only checks that run on every PR should be required.

`develop` is referenced as a push target by several workflows but does not yet
exist as a branch. Create it before enabling required checks that target it.

### Suggested branch-protection settings

- Require the checks above to pass before merging.
- Require branches to be up to date before merging.
- Require at least one approving review.
- Do not allow bypassing the above settings (see the bypass procedure for the
  deliberate exception).

## Emergency bypass

Required checks exist to be trusted, so bypassing them is a logged,
accountable exception rather than a convenience. When a fix must land while CI
is unavailable (a GitHub Actions outage) or to stop an active production
incident:

1. A repository admin uses the branch-protection **"bypass"** path when merging
   (or temporarily unchecks "Do not allow bypassing"). GitHub records who
   merged past the gate; that is the audit trail.
2. The merging admin opens a follow-up issue immediately, linking the merged
   commit and stating why the bypass was necessary.
3. CI is run against the merged commit (re-run the workflow, or push a
   no-op commit) as soon as the blocking condition clears, so any latent
   failure is surfaced rather than hidden by the bypass.
4. If protection settings were changed, they are restored in the same session.

Never bypass to skip a *legitimately failing* check. A red required check is
the system working; the fix is to make it green, not to route around it.
