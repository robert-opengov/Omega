# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

GAB Verticals Boilerplate — a forkable Next.js application for building government apps on top of GAB backend services. Pre-built accessible components, hexagonal data layer, config-driven theming and auth.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint (max 100 warnings)
npm test             # Vitest run once
npm run test:watch   # Vitest watch mode
npx tsc --noEmit     # Type check (used in CI)
```

Run a single test file: `npx vitest run lib/core/adapters/gab-ai/__tests__/bedrock-gateway.adapter.test.ts`

CI runs lint → typecheck → build (Node 22). See `.github/workflows/ci.yml`.

## Architecture (3 Layers)

### Layer 1 — Client
Components in `components/ui/` organized as `atoms/` (33), `molecules/` (57), `organisms/` (20), `layouts/` (3). Components receive data via props — they never call APIs directly.

### Layer 2 — BFF (Next.js Server)
- **Middleware** (`proxy.ts`): auth guards on every request, reads `access_token` cookie, enforces `config/routes.config.ts`
- **Server Actions** (`app/actions/`): server-side functions callable from client components (auth, data mutations)
- **Ports & Adapters** (`lib/core/`): hexagonal data layer

### Layer 3 — Backend (External)
GAB V1 (legacy), GAB V2 (current), Auth0, GAB Bedrock AI Gateway. Accessed only through adapters. Never expose raw API responses to the client.

### Hexagonal Data Layer

- **Ports** (`lib/core/ports/`) — interfaces: `IAuthPort`, `IGabDataRepository`, `IGabSchemaRepository`, `IAIGatewayPort`
- **Adapters** (`lib/core/adapters/`) — V1 adapters (`gab-v1/`), V2 adapters (`gab-v2/`), AI gateway adapter (`gab-ai/`)
- **Composition root** (`lib/core/index.ts`) — wires ports to adapters, controlled by `GAB_API_VERSION` env var
- Swapping backends means writing a new adapter and changing one line in the composition root. Zero component changes.

## Data Flow Patterns

### Pattern A — Server Component (page loads)
Server Component imports repo from `@/lib/core`, awaits data, passes props to `'use client'` component.
```
page.tsx (async Server Component) → repo.fetchData() → <ClientComponent data={data} />
```

### Pattern B — Server Action (mutations, client-triggered)
Server Action in `app/actions/` imports from `@/lib/core`, client component calls the action.
```
'use server' action → authPort.login() → return result to client
```

**Critical rule:** Never import `@/lib/core` in `'use client'` files. Ports use server-only APIs.

## Building a Vertical

1. Define port interface in `lib/core/ports/[vertical].repository.ts`
2. Create adapter in `lib/core/adapters/gab-v2/[vertical].v2.adapter.ts`
3. Register in `lib/core/index.ts`
4. Add feature flag in `config/app.config.ts` + nav entry in `config/navigation.config.ts`
5. Create pages in `app/(dashboard)/[vertical]/` — Server Component pages with `_components/` for client rendering

Use the `create-vertical` skill (`.cursor/skills/create-vertical/SKILL.md`) for a step-by-step walkthrough with code examples.

## Fork Conventions

- **Never modify** `components/ui/` — open an issue upstream instead
- **Page compositions** go in `app/(dashboard)/[feature]/_components/`
- **Fork-level shared components** go in `components/_custom/` (must compose from `@/components/ui/`)
- **Never install** alternative UI libs (MUI, Chakra, Ant)
- **Never use** inline `style={{}}` — Tailwind only via `cn()`
- **Never copy-paste** a boilerplate component to customize it — use its existing props

## Key Conventions

- **Atomic design**: components in `components/ui/` as `atoms/`, `molecules/`, `organisms/`, `layouts/`. Barrel exports via index files.
- **Path alias**: `@/*` maps to project root (e.g., `@/components/ui/atoms`)
- **Styling**: Tailwind CSS v4 with `cn()` helper (`lib/utils.ts`) using `clsx` + `tailwind-merge`. Components use CVA for variants.
- **UI primitives**: Radix UI for accessibility, wrapped with Tailwind styling (shadcn/ui pattern)
- **Forms**: React Hook Form + Zod schemas, composed via `ZodForm` molecule
- **Config-driven**: branding in `config/app.config.ts`, nav in `config/navigation.config.ts`, routes in `config/routes.config.ts`, GAB API in `config/gab.config.ts` (server-only, auto-resolves URL from `GAB_API_VERSION`)
- **Icons**: `lucide-react`
- **Fonts**: Barlow (primary) + Geist Mono (code), loaded via `next/font/google`
- **Tests**: Co-located in `__tests__/` directories. Vitest + Testing Library + jsdom.
- **ESLint**: Flat config with Next.js core-web-vitals + React Compiler rules

### HSL Dynamic Theme System

Colors defined as hex in `config/app.config.ts` → decomposed into HSL CSS variables at runtime by `ThemeProvider`. Override via `NEXT_PUBLIC_THEME_*` env vars. Dark mode uses `@variant dark (&:is(.dark *))` Tailwind v4 pattern.

### Provider Stack

`Providers` (`providers/index.tsx`): `ThemeProvider` → `AuthProvider` → `SidebarProvider` → `ToastProvider`.

### GAB V2 API

URL: `https://gab-core-api.gab.ogintegration.us` (auto-resolved by `config/gab.config.ts` when `GAB_API_VERSION=v2`). Three tiers: Config (public), Platform (auth/apps/users/templates), Workspace (per-app schema/records/pages). All path IDs accept base36 key or UUID. Records support 14 filter operators via `POST .../records/query`. Swagger docs at `/docs`.
