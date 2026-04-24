# Skill: Sync Boilerplate

Sync the current repo with the upstream GAB Boilerplate (`https://github.com/OpenGov/gab-boilerplate.git`). Use this skill when the user says "sync boilerplate", "update boilerplate", "pull from boilerplate", "atualizar boilerplate", or similar.

## Prerequisites

- The repo was set up following the "Getting Started" section of README.md (the `boilerplate` git remote exists).
- If the remote is missing, run `npm run boilerplate:init` first.

## Workflow

### 1 — Check status

Run:

```bash
npm run boilerplate:status
```

Show the user the output. If already up to date, stop here.

### 2 — Preview changes (optional)

If the user wants to see details before merging:

```bash
npm run boilerplate:diff
```

### 3 — Sync

Ensure the working tree is clean (no uncommitted changes). Then run:

```bash
npm run boilerplate:sync
```

If the merge completes without conflicts, remind the user to run `npm install` in case dependencies changed.

### 4 — Resolve conflicts

If the merge produces conflicts, resolve them using these heuristics:

**Prefer the user's version (theirs) in application code:**
- `app/(dashboard)/<vertical>/` — vertical-specific pages and components
- `components/_custom/` — fork-specific shared components
- `lib/core/adapters/` — vertical-specific adapter files
- `config/app.config.ts` — fork-level branding overrides (app name, logo, colors)
- `config/navigation.config.ts` — fork-level nav entries
- `.env.local` — never overwrite local env

**Prefer the boilerplate's version (ours) in shared infrastructure:**
- `components/ui/` — the shared component library (forks must not modify these)
- `lib/utils.ts` — shared utilities
- `config/routes.config.ts` — base route guards
- `config/gab.config.ts` — API configuration
- `proxy.ts` — auth middleware
- `lib/core/ports/` — shared port interfaces
- `lib/core/index.ts` — composition root wiring

**For `package.json`:**
- Accept boilerplate changes for `dependencies` and `devDependencies` versions
- Keep any additional dependencies the fork added
- Merge the `scripts` block (keep both sides)

After resolving, stage and commit:

```bash
git add -A
git commit -m "chore: resolve boilerplate sync conflicts"
```

## First-time setup

If a collaborator cloned the fork repo but does not have the `boilerplate` remote yet, run:

```bash
npm run boilerplate:init
```

This adds the remote and fetches — no merge is performed. The collaborator can then use `npm run boilerplate:sync` normally.

## Underlying scripts

The npm commands delegate to shell scripts in `scripts/boilerplate/`:

| Command | Script | What it does |
|---------|--------|--------------|
| `npm run boilerplate:init` | `scripts/boilerplate/init.sh` | Adds the `boilerplate` remote if missing, fetches |
| `npm run boilerplate:status` | `scripts/boilerplate/status.sh` | Shows ahead/behind counts and new commit subjects |
| `npm run boilerplate:diff` | `scripts/boilerplate/diff.sh` | Full `git log --stat` preview of incoming changes |
| `npm run boilerplate:sync` | `scripts/boilerplate/sync.sh` | Fetches and merges with `--no-ff` |
