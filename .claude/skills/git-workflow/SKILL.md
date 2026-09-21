---
name: git-workflow
description: "Lightweight branch-and-PR workflow for sf-tennis: short branches from origin/master, PR merge for features, direct commits only for trivial docs. Manual Cloudflare deploy, never unless asked."
---

# Git Workflow (sf-tennis)

Small public repo, `master` is the default branch. Features go through short branches + PRs (see PR #1, #2); deploys to Cloudflare Workers are **manual** (`npm run cf:deploy`) and never part of the git workflow unless the user explicitly asks.

---

## Steps

1. `git status` first; preserve uncommitted work.
2. Cut a short branch from `origin/master` (`feat/`, `fix/`) for anything beyond a trivial change.
3. Verify with `npm run build` for code changes. There is no test suite, linter, or formatter — do not invent check commands that aren't in `package.json`.
4. Push and open a PR with `gh pr create`; merge on GitHub. Report the PR URL.
5. Direct commits to `master` are acceptable only for trivial docs or single-file fixes. Never force-push.

---

## Conflict Resolution

Rebase on `origin/master`, re-run build, push. Stop and ask on conflicts in `schema.sql`, `wrangler.jsonc`, or auth/rate-limit code.
