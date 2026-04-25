# GAB Verticals Boilerplate

A forkable Next.js application that provides the frontend foundation for GAB verticals — permitting dashboards, service request portals, and other government applications. It includes pre-built accessible UI components, authentication, theming, routing, and a data layer wired to GAB backend services through a hexagonal architecture that survives backend migrations without UI changes.

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI + custom Tailwind (shadcn/ui pattern) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Markdown | react-markdown + remark-gfm |
| i18n | next-intl (opt-in) |
| Design Tokens | OpenGov Capital Design System v5.5.0 |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 (Next.js core-web-vitals + React Compiler) |
| CI | GitHub Actions (lint, typecheck, build) |

## Getting Started

OpenGov repos cannot be forked. Instead, you create your own repo and add this boilerplate as a secondary git remote called `boilerplate`. This lets you pull boilerplate updates whenever you want without losing your customizations.

### First-time setup

Run these commands once. After the initial merge, the npm shortcut scripts (described below) handle everything.

1. Create a new empty repo on GitHub for your vertical, clone it, and enter the directory:

```bash
git clone <your-repo-url> && cd <your-repo>
```

2. Add the boilerplate as a remote, fetch it, and merge:

```bash
git remote add boilerplate https://github.com/OpenGov/gab-boilerplate.git
git fetch boilerplate
git merge boilerplate/main --allow-unrelated-histories
```

> `--allow-unrelated-histories` is required the first time because your empty repo and the boilerplate have no common ancestor. You will not need this flag again.

3. Install dependencies, create your env file, and push:

```bash
npm install
cp .env.example .env.local
git add -A && git commit -m "chore: initial boilerplate merge"
git push origin main
```

You're done. Your repo now has the full boilerplate code and a `boilerplate` remote configured for future updates.

### Syncing boilerplate updates

After the first-time setup, use the npm shortcuts to stay up to date:

```bash
npm run boilerplate:status   # see how many commits you are behind
npm run boilerplate:diff     # preview what changed before merging
npm run boilerplate:sync     # merge boilerplate updates into your branch
```

If a sync produces merge conflicts, ask Cursor: *"resolve the boilerplate merge conflicts"* — the included Cursor skill knows which side to prefer.

To add the `boilerplate` remote on a collaborator's machine that only cloned your repo (not the boilerplate), run `npm run boilerplate:init`.

### FAQ

**Can I fork instead of using a remote?**
No. OpenGov policy does not allow forking repos. The remote-based workflow described above is the supported path.

**What if I modified files in `components/ui/`?**
The next sync will produce merge conflicts in those files. Avoid modifying `components/ui/` — use `components/_custom/` for fork-specific components. See the [Fork Rules](#fork-rules) section.

**How often should I sync?**
Whenever you want. Weekly is a healthy cadence. Syncing less frequently is fine but means more changes per merge.

### Environment

The default env already targets the V2 API — no URL needed:

```env
GAB_API_VERSION=v2
```

To use V1 (legacy), set the version and the OAuth client ID:

```env
GAB_API_VERSION=v1
GAB_CLIENT_ID=IAFConsulting
```

Optionally customize branding:

```env
NEXT_PUBLIC_APP_NAME="My City Portal"
NEXT_PUBLIC_THEME_PRIMARY="#4B3FFF"
NEXT_PUBLIC_LOGO_URL=https://example.com/logo.svg
```

Start the dev server:

```bash
npm run dev
# Open http://localhost:4200
# Visit /ui to browse every available component
```

> **Before you build anything**, visit `/ui`. Every atom, molecule, and organism is rendered there with live examples. Compose pages from those — do not create new UI components in your fork.

## Architecture

The application is organized into three layers. The browser never talks to the backend directly — the Next.js server sits in between as a BFF (Backend for Frontend).

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Client                                            │
│  React components (33 atoms, 58 molecules, 20 organisms)    │
│  Radix UI + Tailwind CSS, file-based routing in app/        │
│  Components receive data via props — never call APIs        │
└──────────────────────────┬──────────────────────────────────┘
                           │ props / server actions
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 2: BFF (Next.js server)                              │
│  Middleware (proxy.ts) — auth guards on every request        │
│  Server Actions (app/actions/) — callable from client        │
│  Ports & Adapters (lib/core/) — hexagonal data layer        │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch via adapters
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 3: Backend (external services)                       │
│  GAB V1 API, GAB V2 API, Auth0 SSO, GAB AI Gateway          │
│  Accessed exclusively through the adapter layer             │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1 — Client

The browser receives server-rendered HTML and interactive React components organized by complexity:

- **Atoms** (33): smallest building blocks — Button, Input, Badge, Select, Switch, Checkbox
- **Molecules** (58): composed elements — Card, Modal, DataTable, FormField, DatePicker, SiteBanner
- **Organisms** (20): complex components — Navbar, Sidebar, AuthForm, DataGrid, ChartCard, KanbanBoard
- **Layouts** (3): page shells — DashboardLayout, AuthLayout, WizardLayout

Every component uses Radix UI for accessibility and Tailwind CSS for styling. There is one way to style things — utility classes in `className` via the `cn()` helper — which keeps code predictable for both humans and AI agents.

Pages live in `app/` and follow Next.js file-based routing. Creating a new page means creating a new file. No router config to update.

### Layer 2 — BFF (Ports & Adapters)

The Next.js server has three jobs:

**Middleware** (`proxy.ts`) runs on every request. It checks for an `access_token` cookie and enforces route rules from `config/routes.config.ts`. No page component thinks about auth guards.

**Server Actions** (`app/actions/`) are server-side functions callable from client components. The auth server action handles login, token exchange, and cookie management without exposing secrets to the browser.

**Ports & Adapters** (`lib/core/`) are the most important architectural decision:

- **Ports** (`lib/core/ports/`) are TypeScript interfaces that define what the frontend needs: `IAuthPort` (login, profile), `IGabDataRepository` (CRUD rows), `IGabSchemaRepository` (create apps/tables/fields), `IAIGatewayPort` (AI converse/stream/invoke).
- **Adapters** (`lib/core/adapters/`) are implementations against specific APIs. Today: GAB V1 adapters (backward compat), GAB V2 adapters, Auth0 SSO adapter, and GAB AI Gateway adapter (`gab-ai/`).
- **Composition root** (`lib/core/index.ts`) is the single file that wires ports to adapters. Controlled by `GAB_API_VERSION` env var. This is the only file that changes when the backend changes.

Every page calls port methods (`fetchRows()`, `login()`). No component knows or cares whether the backend is GAB V1 or V2. Migration is a new adapter and a one-line wiring change. Zero UI changes.

### Layer 3 — Backend

GAB V1 (legacy), GAB V2 (current), Auth0 for SSO, and the GAB Bedrock AI Gateway. The Boilerplate treats these as external services accessed exclusively through the adapter layer. Adapters transform raw API responses into the shapes defined by port interfaces. The BFF never passes raw API payloads to the browser.

## Data Flow

There are two patterns for getting data to components. Use the right one depending on context.

### Pattern A — Server Component (preferred for page loads)

The page is an `async` Server Component. It imports the repo from `lib/core`, awaits the data, and passes it as props to a `'use client'` component that handles rendering and interactivity.

```tsx
// app/(dashboard)/permitting/home/page.tsx  (Server Component — no 'use client')
import { permittingRepo } from '@/lib/core';
import { PermittingDashboard } from './_components/PermittingDashboard';

export default async function PermittingHomePage() {
  const summary = await permittingRepo.getDashboardSummary();
  return <PermittingDashboard summary={summary} />;
}
```

```tsx
// app/(dashboard)/permitting/home/_components/PermittingDashboard.tsx
'use client';
import { MetricCard } from '@/components/ui/molecules';
import type { DashboardSummary } from '@/lib/core/ports/permitting.repository';

interface PermittingDashboardProps {
  summary: DashboardSummary;
}

export function PermittingDashboard({ summary }: PermittingDashboardProps) {
  return (
    <div className="space-y-6 p-6">
      <MetricCard title="Pending Applications" value={String(summary.pendingCount)} />
      {/* ... */}
    </div>
  );
}
```

### Pattern B — Server Action (for mutations and client-triggered fetches)

Server Actions are functions marked `'use server'` that run on the server but are callable from client components. Use them for form submissions, mutations, and any user-triggered data operation.

```tsx
// app/actions/auth.ts
'use server';
import { authPort } from '@/lib/core';

export async function loginAction(username: string, password: string) {
  const result = await authPort.login({ username, password });
  // Set cookies, return session data
  return { success: true, user: result };
}
```

```tsx
// Client component calls the server action
'use client';
import { loginAction } from '@/app/actions/auth';

function LoginForm() {
  const handleSubmit = async (data) => {
    const result = await loginAction(data.email, data.password);
  };
}
```

**Rule of thumb:** Server Components + props for initial page data. Server Actions for anything the user triggers.

**Never do this:** Import `@/lib/core` in a `'use client'` file. The ports use server-only APIs (cookies, env vars). Client components get data via props or server actions — never directly from the data layer.

**File uploads via server actions:** Server actions accept `FormData` natively, which is the correct way to send files. Next.js defaults to a 1MB body size limit for server actions. If your fork handles file uploads (PDFs, images, documents), increase the limit in `next.config.ts` to match your use case:

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '10mb', // adjust based on expected file sizes
  },
},
```

## Config-Driven Customization

Most changes to a vertical don't require touching component code. Four config files control identity and behavior:

| File | Controls |
|------|----------|
| `config/app.config.ts` | App name, description, theme colors, layout mode, feature flags |
| `config/navigation.config.ts` | Sidebar and navbar menu items, icons, role-based visibility |
| `config/routes.config.ts` | Public routes, auth-only routes, redirect targets |
| `config/auth.config.ts` | Login mode (password/SSO/both), silent login behavior |

Every value in `app.config.ts` can be overridden via environment variables. A single codebase can be deployed as multiple branded verticals — Boston Permitting and Tampa Permitting are the same Docker image with different env vars.

## Theming

The theme system is built on HSL color decomposition. Define a color as hex in `config/app.config.ts` (or via env var). The `ThemeProvider` decomposes it into HSL components and sets CSS custom properties:

```
--primary-h: 244
--primary-s: 100%
--primary-l: 63%
```

All component styles reference these variables through Tailwind's CSS `hsl()` + `calc()`. Lighter shades, darker shades, hover states, backgrounds, borders — everything derives mathematically from the base values. Changing one hex value cascades through the entire app.

Override via environment variables:

```env
NEXT_PUBLIC_THEME_PRIMARY="#4B3FFF"
NEXT_PUBLIC_THEME_SECONDARY="#757575"
NEXT_PUBLIC_THEME_SUCCESS="#2E7D32"
NEXT_PUBLIC_THEME_WARNING="#ED6C02"
NEXT_PUBLIC_THEME_DANGER="#D32F2F"
NEXT_PUBLIC_THEME_INFO="#0288D1"
NEXT_PUBLIC_THEME_IN_PROGRESS="#7B1FA2"
```

Default palette is aligned with **OpenGov Capital Design System v5.5.0**.

Dark mode uses the `@variant dark (&:is(.dark *))` Tailwind v4 pattern, toggled via the navbar (`enableDarkMode` feature flag).

### Page Surface (Content Canvas)

Two HSL surface tokens control the page canvas and elevated panels:

| Token | Tailwind class | Light | Dark |
|---|---|---|---|
| `--surface-canvas` | `bg-surface-canvas` | Subtle gray (`L=96%`, primary-hue tinted) | Dark gray (`L=7%`, primary-hue tinted) |
| `--surface-panel` | `bg-surface-panel` | White | Slightly elevated dark (`L=10%`) |

Both derive from `--primary-h` / `--primary-s`, so they automatically adapt when the brand color changes.

**Convention for OpenGov-branded verticals:** wrap the page content area in `bg-surface-canvas` so cards and panels visually float on a gray canvas (matching the OpenGov CDS patterns). Elevated sections within the canvas use `bg-surface-panel` or `bg-card`.

```tsx
export function MyDashboard({ data }: Props) {
  return (
    <div className="bg-surface-canvas">
      <div className="p-6 space-y-6 max-w-[var(--content-max-width)] mx-auto">
        {/* Cards, grids, panels sit on the gray canvas */}
      </div>
    </div>
  );
}
```

Custom forks that don't follow the OpenGov visual language can skip `bg-surface-canvas` entirely — the default `DashboardLayout` renders on `bg-background` (white in light, dark in dark).

## Authentication

Auth is controlled by three config layers:

### Master switch

Set `AUTH_ENABLED=false` in `.env.local` to disable all auth. Middleware skips redirects and root `/` always goes to `/home`. Useful for public landing pages or kiosk apps.

### Login mode

`AUTH_LOGIN_MODE` controls which login methods are available:

| Value | Behavior |
|-------|----------|
| `password` | Username/password form only |
| `sso` | SSO button only (Auth0) |
| `both` (default) | Password form + SSO button |

### Auth0 SSO

When `AUTH_LOGIN_MODE` is `sso` or `both`, configure Auth0:

```env
NEXT_PUBLIC_AUTH0_DOMAIN=login.ogintegration.us
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=opengov
```

`AUTH_ENABLE_SILENT_LOGIN=true` attempts automatic login from an active Auth0 session. Defaults to `true` for `sso` mode, `false` for `both`.

**Config files:** `config/auth.config.ts` (server-only) and `config/auth0.config.ts` (client-safe). Never import `auth.config.ts` from client components.

## Feature Flags

Feature flags live in `config/app.config.ts` and are overridable via env vars:

- **On by default** (opt-out): disabled by setting `=false`
- **Off by default** (opt-in): enabled by setting `=true`

| Variable | Default | Pattern | Description |
|----------|---------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_DARK_MODE` | on | opt-out | Dark mode toggle in navbar |
| `NEXT_PUBLIC_ENABLE_SIGNUP` | on | opt-out | `/signup` route and sign-up links |
| `NEXT_PUBLIC_ENABLE_I18N` | off | opt-in | Multi-language support (next-intl) |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | off | opt-in | Notification badge in navbar |
| `NEXT_PUBLIC_ENABLE_SITE_BANNER` | off | opt-in | Full-width site identifier banner above navbar |

## Building a Vertical

A vertical is a domain-specific set of pages backed by a port/adapter pair. Follow the structure below, or use the `create-vertical` skill (`.cursor/skills/create-vertical/SKILL.md`) for a detailed walkthrough.

### Step 1 — Define the port

Create `lib/core/ports/[vertical].repository.ts`. Define TypeScript interfaces for your domain types and a repository interface with the methods your pages need:

```typescript
export interface PermitApplication { id: string; title: string; status: string; /* ... */ }

export interface IPermittingRepository {
  getDashboardSummary(): Promise<DashboardSummary>;
  listApplications(params: PaginatedParams): Promise<PaginatedResult<PermitApplication>>;
  getApplication(id: string): Promise<PermitApplication>;
  createApplication(data: CreateApplicationParams): Promise<PermitApplication>;
}
```

### Step 2 — Create the adapter

Create `lib/core/adapters/gab-v2/[vertical].v2.adapter.ts` (or a mock during early prototyping). For example:

```typescript
import type { IPermittingRepository } from '../../ports/permitting.repository';

export class PermittingV2Adapter implements IPermittingRepository {
  constructor(private readonly authPort: IAuthPort, private readonly apiUrl: string) {}
  async getDashboardSummary() {
    // Call GAB V2 API and map to the port shape
  }
}
```

### Step 3 — Register in the composition root

In `lib/core/index.ts`, instantiate and export:

```typescript
import { PermittingV2Adapter } from './adapters/gab-v2/permitting.v2.adapter';
export const permittingRepo = new PermittingV2Adapter(authPort, gabConfig.apiUrl);
```

### Step 4 — Add feature flag and navigation

In `config/app.config.ts`, add to `AppFeatures`:

```typescript
enablePermitting: process.env.NEXT_PUBLIC_ENABLE_PERMITTING === 'true',
```

In `config/navigation.config.ts`, add the nav entry:

```typescript
{ href: '/permitting', label: 'Permitting', icon: FileText, featureFlag: 'enablePermitting' },
```

### Step 5 — Create pages

Follow this structure:

```
app/(dashboard)/permitting/
├── layout.tsx                       # Pass-through or vertical-specific layout
├── page.tsx                         # Redirect to /permitting/home
├── home/
│   ├── page.tsx                     # Server Component: fetch from permittingRepo
│   └── _components/
│       └── PermittingDashboard.tsx   # 'use client': renders with atoms/molecules
├── applications/
│   ├── page.tsx                     # List page
│   ├── _components/
│   │   └── ApplicationsListPage.tsx
│   └── [id]/
│       ├── page.tsx                 # Detail page
│       └── _components/
│           └── ApplicationDetailView.tsx
```

Every `page.tsx` is a Server Component that fetches data and passes props. Every `_components/*.tsx` is a `'use client'` component that renders using the component library. This separation is critical — it keeps data fetching on the server and interactivity on the client.

### Step 6 — Build the real adapter

Once pages work with mock data, create `lib/core/adapters/gab-v2/[vertical].v2.adapter.ts`. Implement the same port interface, this time calling the real GAB V2 API. Swap the one line in `lib/core/index.ts`. Zero page changes.

## Fork Rules

This is a **compose-first** codebase. Forks build pages by assembling existing components, not by creating new ones.

### Do not modify `components/ui/`

The component library is the shared foundation. Modifying it in a fork creates merge conflicts and breaks consistency. If you need a component that doesn't exist, open an issue on the boilerplate repo.

### Page-specific compositions go in `_components/`

Each page can have a `_components/` directory for compositions that are specific to that page:

```
app/(dashboard)/my-feature/
├── page.tsx
└── _components/
    └── MyDashboard.tsx    # Composes Card + MetricCard + Badge
```

### Fork-level shared components go in `components/_custom/`

If your fork needs a reusable component that doesn't exist in the boilerplate:

```
components/
├── ui/          # NEVER MODIFY — from boilerplate
└── _custom/     # Fork-specific shared components
    └── CityMap.tsx   # Must compose from @/components/ui/*
```

Rules for `_custom/` components:
- Must import from `@/components/ui/` — compose, don't recreate
- Cannot duplicate anything that exists in `ui/`
- Should be reviewed for potential upstreaming to the boilerplate

### Always use Tailwind via `cn()`

Never use inline `style={{}}`. Never install alternative UI libraries (MUI, Chakra, Ant). Never add custom CSS files. Use `cn()` from `@/lib/utils` with Tailwind classes.

## Component Library

All components live in `components/ui/` with Radix UI accessibility, CVA variants, and dark mode support. **Browse them at `/ui` when the dev server is running.**

### Atoms (33)

Avatar, Badge, Button, ButtonGroup, Checkbox, Chip, Code, Heading, IconButton, Input, Kbd, Label, Link, MaskedInput, NavigationProgress, NumberInput, Progress, RadioGroup, Select, SelectionCard, Separator, Skeleton, Slider, Spinner, StatBadge, StatusDot, StatusStep, Switch, Text, Textarea, ThresholdProgress, Toggle, Tooltip

### Molecules (58)

Accordion, ActivityFeed, AddressInput, Alert, AvatarGroup, Banner, Breadcrumbs, BreakdownCard, Card, CategoryGrid, CheckboxTree, CollapsibleTable, Combobox, CommandPalette, ComposeInput, ConfirmDialog, ContentHeader, DashboardWidget, DataTable, DatePicker, DeadlineItem, DropdownMenu, EmptyState, ExpandableListItem, FilePreviewCard, FileUpload, FormField, Hero, InfoCard, LabelValuePair, LabeledProgressRow, List, MapLegend, MentionInput, MetricCard, Modal, OnboardingWizard, PageContent, PageHeader, Pagination, Popover, ProgressSteps, ResponsiveGrid, SearchInput, SectionHeader, Sheet, SiteBanner, SsoLoginButton, StatusChecklist, SummaryCard, Tabs, TagInput, Toast, Toolbar, UploadSlot, ValueItem, WizardCard, ZodForm

### Organisms (20)

AIConversation, AIDisclaimer, AIPromptInput, AuthForm, ChartCard, DataGrid, DetailPageHeader, DynamicForm, FilterBuilder, Footer, FullscreenWizard, GanttChart, KanbanBoard, LocationMap, Logo, Navbar, Sidebar, SignupForm, Timeline, WidgetGrid

### Layouts (3)

AuthLayout, DashboardLayout, WizardLayout

## GAB V2 API

The GAB backend (V2) is organized into three tiers:

| Tier | Prefix | Auth | Purpose |
|------|--------|------|---------|
| Config | `/v2/auth/app-config.json` | None | Public auth mode configuration |
| Platform | `/v2/auth/*`, `/v2/apps`, `/v2/users`, `/v2/templates` | Varies | Auth, app catalog, user management, templates |
| Workspace | `/v2/apps/:appId/*` | Required | Per-app schema, records, relationships, pages |

Key endpoints:

| Operation | Endpoint |
|-----------|----------|
| Login | `POST /v2/auth/token` |
| List records | `GET /v2/apps/:appId/tables/:tableId/records` |
| Query records (filters) | `POST /v2/apps/:appId/tables/:tableId/records/query` |
| Create record | `POST /v2/apps/:appId/tables/:tableId/records` |
| Update record | `PATCH /v2/apps/:appId/tables/:tableId/records/:recordId` |
| Delete record | `DELETE /v2/apps/:appId/tables/:tableId/records/:recordId` |
| List tables | `GET /v2/apps/:appId/tables` |
| Create table | `POST /v2/apps/:appId/tables` |
| Create field | `POST /v2/apps/:appId/tables/:tableId/fields` |
| Create relationship | `POST /v2/apps/:appId/relationships` |
| User permissions | `GET /v2/apps/:appId/my-permissions` |

All `:appId`, `:tableId`, and `:fieldId` path parameters accept either a base36 key or a UUID. Record IDs are integers.

The V2 API supports 14 filter operators (`eq`, `neq`, `in`, `gt`, `gte`, `lt`, `lte`, `between`, `contains`, `not_contains`, `starts_with`, `ends_with`, `is_null`, `not_null`) via structured JSON in the query body.

Interactive docs: [Swagger UI](https://gab-core-api.gab.ogintegration.us/docs)

## Deployment Model

### Templated verticals (same features, different branding)

One codebase, many deploys. Differentiate via environment variables:

```
gab-permitting/ (single repo)
├── deploy: boston  → APP_NAME="Boston Permitting", THEME_PRIMARY="#0A2240"
├── deploy: tampa  → APP_NAME="Tampa Permitting", THEME_PRIMARY="#00573F"
└── deploy: denver → APP_NAME="Denver Permitting", THEME_PRIMARY="#8B2332"
```

Same code, same CI, same tests. Bug fixes ship to every customer on the next deploy.

### Custom verticals (unique features)

Fork the repo. The hexagonal architecture and config-driven approach minimize fork-specific code. Most divergence lives in:
- `app/(dashboard)/[vertical]/` — vertical-specific pages
- `lib/core/ports/` and `lib/core/adapters/` — domain-specific data layer
- `config/` — branding and navigation

## Environment Variables

Copy `.env.example` to `.env.local`. The example file is fully commented.

### GAB API

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GAB_API_VERSION` | No | `v2` | `v1` (legacy) or `v2`. Auto-resolves the API URL. |
| `GAB_API_URL` | No | auto | Override the auto-resolved URL for custom deployments |
| `GAB_CLIENT_ID` | V1 only | — | OAuth client_id for V1 `/token` request |
| `GAB_SERVICE_USERNAME` | No | — | Service account username (M2M flows) |
| `GAB_SERVICE_PASSWORD` | No | — | Service account password |
| `GAB_APP_KEY` | No | — | App-specific GAB key |
| `GAB_TABLE_SERVICE_REQUESTS` | No | — | Table key for service requests |
| `GAB_TABLE_ACTIVITIES` | No | — | Table key for activities |

> **Switching versions:** Set `GAB_API_VERSION=v1` or `v2`. The API URL resolves automatically (`v1` → `devapi.ignatius.io`, `v2` → `gab-core-api.gab.ogintegration.us`). V1 also requires `GAB_CLIENT_ID`.

### App Customization

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `GAB Application` | App name (navbar, page titles) |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `Powered by GAB` | App description (meta tags) |
| `NEXT_PUBLIC_LOGO_URL` | — | Custom logo URL (navbar + sidebar) |
| `NEXT_PUBLIC_LOGIN_HERO_IMAGE` | `/brand/login.webp` | Login page hero image |

### Site Banner

When `NEXT_PUBLIC_ENABLE_SITE_BANNER=true`, a full-width identifier bar renders above the navbar.

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SITE_BANNER_ORG` | — | Organization name (required when enabled) |
| `NEXT_PUBLIC_SITE_BANNER_LOGO_URL` | — | Logo URL displayed before the org name |
| `NEXT_PUBLIC_SITE_BANNER_STATEMENT` | `An official website of the {org}.` | Custom statement text |
| `NEXT_PUBLIC_SITE_BANNER_VARIANT` | `dark` | Visual variant: `dark` or `light` |

### Layout

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SHOW_NAVBAR` | `true` | Show top navbar |
| `NEXT_PUBLIC_SHOW_SIDEBAR` | `true` | Show left sidebar |
| `NEXT_PUBLIC_LAYOUT_MODE` | — | Shorthand: `navbar-sidebar` / `navbar-only` / `sidebar-only` / `none` |

### Auth Strategy (server-only)

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `true` | Master auth switch |
| `AUTH_LOGIN_MODE` | `both` | `password` / `sso` / `both` |
| `AUTH_ENABLE_SILENT_LOGIN` | `true` for sso, `false` for both | Auto-login from active Auth0 session |

### Auth0 SSO

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 tenant domain (without `https://`) |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 application client ID |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | Auth0 API audience identifier |

### Theme Colors

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_THEME_PRIMARY` | `#4B3FFF` | Main brand color |
| `NEXT_PUBLIC_THEME_SECONDARY` | `#757575` | Secondary accent |
| `NEXT_PUBLIC_THEME_SUCCESS` | `#2E7D32` | Success states |
| `NEXT_PUBLIC_THEME_WARNING` | `#ED6C02` | Warning states |
| `NEXT_PUBLIC_THEME_DANGER` | `#D32F2F` | Error/destructive states |
| `NEXT_PUBLIC_THEME_INFO` | `#0288D1` | Informational states |
| `NEXT_PUBLIC_THEME_IN_PROGRESS` | `#7B1FA2` | In-progress/pending states |

### GAB Bedrock AI Gateway (server-only)

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_GATEWAY_BASE_URL` | `https://gab-bedrock-ai-gateway.gab-test.com` | AI gateway URL |
| `AI_GATEWAY_TOKEN` | — | Bearer token (`gab_…`). Stored in SSM. |
| `AI_GATEWAY_DEFAULT_MODEL` | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | Default model id |

### OCR Service (server-only)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OCR_SERVICE_URL` | Yes | — | Base URL for the OCR microservice (no trailing slash) |

### Runtime

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Runtime environment |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint (max 100 warnings) |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npx tsc --noEmit` | Type check (used in CI) |

## AWS Deployment

The `gab-aws-deploy-kit/` folder is a self-contained toolkit for deploying to AWS ECS Fargate. Copy it into any fork, configure three files, and deploy.

**Key concept:** Next.js inlines `NEXT_PUBLIC_*` variables into the client bundle at build time. These go in `deploy-build-args` (passed as Docker `--build-arg`). All other secrets are injected at runtime via SSM Parameter Store and are listed in `deploy-secrets`.

```bash
cd gab-aws-deploy-kit
cp deploy-config.example deploy-config
cp deploy-secrets.example deploy-secrets
cp deploy-build-args.example deploy-build-args

./bin/setup.sh                               # Create AWS infrastructure
./bin/secrets.sh import deploy-secrets.values # Seed SSM secrets
./bin/release-prepare.sh                     # Build + scan + push to ECR
./bin/deploy.sh release-xxx                  # Deploy to ECS
```

See [`gab-aws-deploy-kit/README.md`](gab-aws-deploy-kit/README.md) for the full reference.
