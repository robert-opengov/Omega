# Contributing to a GAB Vertical Fork

This guide helps you contribute to a fork of the GAB Verticals Boilerplate. Read the [README](README.md) first — it covers architecture, data flow, and fork rules in full detail.

## Quick Links

| What you need | Where to find it |
|---------------|-----------------|
| Architecture overview | [README — Architecture](README.md#architecture) |
| How data flows from API to component | [README — Data Flow](README.md#data-flow) |
| What you can and cannot modify in a fork | [README — Fork Rules](README.md#fork-rules) |
| Step-by-step vertical creation | [README — Building a Vertical](README.md#building-a-vertical) |
| Browse every UI component | Run `npm run dev` and visit `/ui` |
| Canonical vertical example | `app/(dashboard)/grants/` (16 files) |

## Five Rules

1. **Never modify `components/ui/`.** This is the shared component library. Propose changes via an issue on the boilerplate repo.
2. **Never install alternative UI libraries.** No MUI, Chakra, Ant, or extra CSS frameworks. Everything is Radix UI + Tailwind.
3. **Never import `@/lib/core` in a `'use client'` file.** Ports are server-only. Client components get data via props or server actions.
4. **Never use inline styles.** Use Tailwind classes via `cn()` from `@/lib/utils`.
5. **Never copy a boilerplate component to customize it.** Use its existing props. If the props don't cover your case, open an issue.

## Where to Put Your Code

| What | Where |
|------|-------|
| Page-specific UI compositions | `app/(dashboard)/[feature]/_components/` |
| Fork-level shared components | `components/_custom/` (must compose from `@/components/ui/`) |
| Domain data layer (port + adapter) | `lib/core/ports/` and `lib/core/adapters/` |
| Server actions for your vertical | `app/actions/[vertical].ts` |
| Feature flags and nav entries | `config/app.config.ts` and `config/navigation.config.ts` |

## Proposing Upstream Changes

If your fork needs something the boilerplate should provide (a new component variant, a shared hook, a config option):

1. Open an issue on the boilerplate repo describing the need and the use case
2. Include a screenshot or code snippet showing what you're trying to achieve
3. Reference which existing component is closest to what you need
4. An engineer will evaluate whether to add it to the boilerplate or suggest an alternative

## Before You Submit a PR

- [ ] `npm run build` passes with no errors
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm run lint` passes (max 100 warnings)
- [ ] No files in `components/ui/` were modified
- [ ] No new dependencies added without team approval
- [ ] All `'use client'` files import only from `@/components/ui/*`, not from `@/lib/core`
