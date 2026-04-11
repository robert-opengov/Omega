# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

GAB Verticals Boilerplate — the "Lego Bucket" foundation for AI-generated government applications (Government App Builder). Fork it, configure branding/data sources, and compose verticals (311 apps, Grants portals, Permitting dashboards) from pre-built accessible components.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint (max 100 warnings)
npm test             # Vitest run once
npm run test:watch   # Vitest watch mode
npx tsc --noEmit     # Type check (used in CI)
```

Run a single test file: `npx vitest run components/ui/organisms/ChildTable/__tests__/reducer.test.ts`

CI runs lint → typecheck → build (Node 22). See `.github/workflows/ci.yml`.

## Architecture

### Hexagonal (Ports & Adapters) Data Layer

- **Ports** (`lib/core/ports/`) — interfaces: `IAuthPort`, `IGabDataRepository`, schema repo, child-table repo
- **Adapters** (`lib/core/adapters/gab-v1/`) — implementations against the GAB v1 API
- Swapping backends means writing new adapters; no component changes needed

### HSL Dynamic Theme System

All colors defined as hex in `config/app.config.ts` → decomposed into HSL CSS variables (`--primary-h`, `--primary-s`, `--primary-l`) at runtime by `ThemeProvider` and root layout's `buildThemeStyle()`. Derived shades use CSS `hsl()` + `calc()`. Override via `NEXT_PUBLIC_THEME_*` env vars. Defaults aligned with OpenGov Capital Design System v5.5.0.

Dark mode uses the `@variant dark (&:is(.dark *))` Tailwind v4 pattern in `globals.css`.

### Provider Stack

`Providers` component (`providers/index.tsx`) wraps the app: `ThemeProvider` → `AuthProvider` → `SidebarProvider` → `ToastProvider`. Context hooks exported from `providers/index.tsx`.

### Auth & Middleware

`proxy.ts` is the Next.js middleware — reads `access_token` cookie and enforces route rules from `config/routes.config.ts`. Auth-only routes (login/register) redirect authenticated users to `/home`; protected routes redirect unauthenticated users to `/login`.

### i18n

`next-intl` wired via `i18n/request.ts` plugin in `next.config.ts`. Currently only `en` locale in `messages/en.json`. Feature-flagged off by default (`config/app.config.ts` → `features.enableI18n`).

## Key Conventions

- **Atomic design**: components in `components/ui/` organized as `atoms/`, `molecules/`, `organisms/`, `layouts/`. Barrel exports via index files.
- **Path alias**: `@/*` maps to project root (e.g., `@/components/ui/atoms`)
- **Styling**: Tailwind CSS v4 with `cn()` helper (`lib/utils.ts`) using `clsx` + `tailwind-merge`. Components use CVA (class-variance-authority) for variants.
- **UI primitives**: Radix UI for accessibility, wrapped with Tailwind styling (shadcn/ui pattern)
- **Forms**: React Hook Form + Zod schemas, composed via `ZodForm` molecule
- **Config-driven customization**: branding in `config/app.config.ts`, nav items in `config/navigation.config.ts`, route rules in `config/routes.config.ts`, GAB API keys in `config/gab.config.ts` (server-only — never import from client components)
- **Icons**: `lucide-react`
- **Fonts**: Barlow (primary) + Geist Mono (code), loaded via `next/font/google`
- **Tests**: Co-located in `__tests__/` directories next to source. Vitest + Testing Library + jsdom. Setup extends jest-dom matchers.
- **ESLint**: Flat config (`eslint.config.mjs`) with Next.js core-web-vitals + React Compiler lint rules (`react-hooks/set-state-in-effect`, `refs`, `preserve-manual-memoization`, `immutability`)
