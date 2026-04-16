# GAB Verticals Boilerplate

A forkable Next.js application that provides the frontend foundation for GAB verticals — 311 apps, grants portals, permitting dashboards, and other government applications. It includes pre-built accessible UI components, authentication, theming, routing, and a data layer wired to GAB backend services through a hexagonal architecture that survives backend migrations without UI changes.

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI + custom Tailwind (shadcn/ui pattern) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| i18n | next-intl (opt-in) |
| Design Tokens | OpenGov Capital Design System v5.5.0 |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 (Next.js core-web-vitals + React Compiler) |
| CI | GitHub Actions (lint, typecheck, build) |

## Quick Start

```bash
git clone <repo-url> && cd gab-boilerplate
npm install
cp .env.example .env.local
```

Set the two required values in `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://devapi.ignatius.io
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
# Open http://localhost:3000
# Visit /ui to browse every available component
```

> **Before you build anything**, visit `/ui`. Every atom, molecule, and organism is rendered there with live examples. Compose pages from those — do not create new UI components in your fork.

## Architecture

The application is organized into three layers. The browser never talks to the backend directly — the Next.js server sits in between as a BFF (Backend for Frontend).

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Client                                            │
│  React components (33 atoms, 58 molecules, 21 organisms)    │
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
│  GAB V1 API, GAB V2 API, Auth0 SSO                         │
│  Accessed exclusively through the adapter layer             │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1 — Client

The browser receives server-rendered HTML and interactive React components organized by complexity:

- **Atoms** (33): smallest building blocks — Button, Input, Badge, Select, Switch, Checkbox
- **Molecules** (58): composed elements — Card, Modal, DataTable, FormField, DatePicker, SiteBanner
- **Organisms** (21): complex components — Navbar, Sidebar, AuthForm, ChildTable, DataGrid, ChartCard
- **Layouts** (3): page shells — DashboardLayout, AuthLayout, WizardLayout

Every component uses Radix UI for accessibility and Tailwind CSS for styling. There is one way to style things — utility classes in `className` via the `cn()` helper — which keeps code predictable for both humans and AI agents.

Pages live in `app/` and follow Next.js file-based routing. Creating a new page means creating a new file. No router config to update.

### Layer 2 — BFF (Ports & Adapters)

The Next.js server has three jobs:

**Middleware** (`proxy.ts`) runs on every request. It checks for an `access_token` cookie and enforces route rules from `config/routes.config.ts`. No page component thinks about auth guards.

**Server Actions** (`app/actions/`) are server-side functions callable from client components. The auth server action handles login, token exchange, and cookie management without exposing secrets to the browser.

**Ports & Adapters** (`lib/core/`) are the most important architectural decision:

- **Ports** (`lib/core/ports/`) are TypeScript interfaces that define what the frontend needs: `IAuthPort` (login, profile), `IGabDataRepository` (CRUD rows), `IGabSchemaRepository` (create apps/tables/fields), `IChildTableRepository` (datatable operations), `IGrantsRepository` (grants domain).
- **Adapters** (`lib/core/adapters/`) are implementations against specific APIs. Today: GAB V1 adapters, GAB V2 adapters, Auth0 SSO adapter, and a Grants mock adapter.
- **Composition root** (`lib/core/index.ts`) is the single file that wires ports to adapters. Controlled by `GAB_API_VERSION` env var. This is the only file that changes when the backend changes.

Every page calls port methods (`fetchRows()`, `login()`, `getDashboardSummary()`). No component knows or cares whether the backend is GAB V1 or V2. Migration is a new adapter and a one-line wiring change. Zero UI changes.

### Layer 3 — Backend

GAB V1 today, GAB V2 on Bedrock, plus Auth0 for SSO. The Boilerplate treats these as external services accessed exclusively through the adapter layer. Adapters transform raw API responses into the shapes defined by port interfaces. The BFF never passes raw API payloads to the browser.

## Data Flow

There are two patterns for getting data to components. Use the right one depending on context.

### Pattern A — Server Component (preferred for page loads)

The page is an `async` Server Component. It imports the repo from `lib/core`, awaits the data, and passes it as props to a `'use client'` component that handles rendering and interactivity.

```tsx
// app/(dashboard)/grants/home/page.tsx  (Server Component — no 'use client')
import { grantsRepo } from '@/lib/core';
import { GrantsDashboard } from './_components/GrantsDashboard';

export default async function GrantsHomePage() {
  const [summary, flags] = await Promise.all([
    grantsRepo.getDashboardSummary(),
    grantsRepo.getComplianceFlags(),
  ]);
  return <GrantsDashboard summary={summary} flags={flags} />;
}
```

```tsx
// app/(dashboard)/grants/home/_components/GrantsDashboard.tsx
'use client';
import { MetricCard, Alert } from '@/components/ui/molecules';

interface GrantsDashboardProps {
  summary: DashboardSummary;
  flags: ComplianceFlag[];
}

export function GrantsDashboard({ summary, flags }: GrantsDashboardProps) {
  // Render using atoms + molecules. No API calls here.
  return (
    <div className="space-y-6 p-6">
      <MetricCard title="Funds" value={summary.fundsUnderManagement} />
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

## Config-Driven Customization

Most changes to a vertical don't require touching component code. Four config files control identity and behavior:

| File | Controls |
|------|----------|
| `config/app.config.ts` | App name, description, theme colors, layout mode, feature flags |
| `config/navigation.config.ts` | Sidebar and navbar menu items, icons, role-based visibility |
| `config/routes.config.ts` | Public routes, auth-only routes, redirect targets |
| `config/auth.config.ts` | Login mode (password/SSO/both), silent login behavior |

Every value in `app.config.ts` can be overridden via environment variables. A single codebase can be deployed as multiple branded verticals — Boston 311 and Tampa 311 are the same Docker image with different env vars.

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
| `NEXT_PUBLIC_ENABLE_GRANTS` | off | opt-in | Grants vertical (nav + routes) |
| `NEXT_PUBLIC_ENABLE_311` | off | opt-in | 311 vertical (nav + routes) |
| `NEXT_PUBLIC_ENABLE_SITE_BANNER` | off | opt-in | Full-width site identifier banner above navbar |

## Building a Vertical

A vertical is a domain-specific set of pages (Grants, 311, Permitting) backed by a port/adapter pair. The Grants vertical is the canonical example — follow its structure exactly.

### Step 1 — Define the port

Create `lib/core/ports/[vertical].repository.ts`. Define TypeScript interfaces for your domain types and a repository interface with the methods your pages need:

```typescript
export interface ServiceRequest { id: string; title: string; status: string; /* ... */ }

export interface I311Repository {
  getDashboardSummary(): Promise<DashboardSummary>;
  listRequests(params: PaginatedParams): Promise<PaginatedResult<ServiceRequest>>;
  getRequest(id: string): Promise<ServiceRequest>;
  createRequest(data: CreateRequestParams): Promise<ServiceRequest>;
}
```

### Step 2 — Create a mock adapter

Create `lib/core/adapters/mock/[vertical].mock.adapter.ts`. Return static data so you can build all pages without a real backend:

```typescript
import type { I311Repository } from '../../ports/311.repository';

export class Mock311Adapter implements I311Repository {
  async getDashboardSummary() {
    return { openRequests: 142, avgResolutionDays: 3.2 /* ... */ };
  }
  // Implement all methods with static data
}
```

### Step 3 — Register in the composition root

In `lib/core/index.ts`, instantiate and export:

```typescript
import { Mock311Adapter } from './adapters/mock/311.mock.adapter';
export const repo311 = new Mock311Adapter();
```

Later, swap to the real adapter:

```typescript
import { Gab311V2Adapter } from './adapters/gab-v2/311.v2.adapter';
export const repo311 = new Gab311V2Adapter(authPort, gabConfig.apiUrl);
```

### Step 4 — Add feature flag and navigation

In `config/app.config.ts`, add to `AppFeatures`:

```typescript
enable311: process.env.NEXT_PUBLIC_ENABLE_311 === 'true',
```

In `config/navigation.config.ts`, add the nav entry:

```typescript
{ href: '/311', label: '311 Requests', icon: FileText, featureFlag: 'enable311' },
```

### Step 5 — Create pages

Follow this structure:

```
app/(dashboard)/311/
├── layout.tsx                  # Pass-through or vertical-specific layout
├── page.tsx                    # Redirect to /311/home
├── home/
│   ├── page.tsx                # Server Component: fetch from repo311
│   └── _components/
│       └── Dashboard311.tsx    # 'use client': renders with atoms/molecules
├── requests/
│   ├── page.tsx                # List page
│   ├── _components/
│   │   └── RequestsListPage.tsx
│   └── [id]/
│       ├── page.tsx            # Detail page
│       └── _components/
│           └── RequestDetailView.tsx
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

### Organisms (21)

AIConversation, AIDisclaimer, AIPromptInput, AuthForm, ChartCard, ChildTable, DataGrid, DetailPageHeader, DynamicForm, FilterBuilder, Footer, FullscreenWizard, GanttChart, KanbanBoard, LocationMap, Logo, Navbar, Sidebar, SignupForm, Timeline, WidgetGrid

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
gab-311/ (single repo)
├── deploy: boston  → APP_NAME="Boston 311", THEME_PRIMARY="#0A2240"
├── deploy: tampa  → APP_NAME="Tampa 311", THEME_PRIMARY="#00573F"
└── deploy: denver → APP_NAME="Denver 311", THEME_PRIMARY="#8B2332"
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
| `NEXT_PUBLIC_API_URL` | Yes | — | GAB API base URL |
| `GAB_CLIENT_ID` | Yes | `IAFConsulting` | OAuth client_id for `/token` |
| `GAB_API_VERSION` | No | `v1` | API version for adapters (`v1` or `v2`) |
| `GAB_SERVICE_USERNAME` | No | — | Service account username (M2M flows) |
| `GAB_SERVICE_PASSWORD` | No | — | Service account password |
| `GAB_APP_KEY` | No | — | App-specific GAB key |
| `GAB_TABLE_SERVICE_REQUESTS` | No | — | Table key for service requests |
| `GAB_TABLE_ACTIVITIES` | No | — | Table key for activities |

### App Customization

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `GAB Application` | App name (navbar, page titles) |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `Powered by GAB` | App description (meta tags) |
| `NEXT_PUBLIC_LOGO_URL` | — | Custom logo URL (navbar + sidebar) |
| `NEXT_PUBLIC_LOGIN_HERO_IMAGE` | `/brand/login.png` | Login page hero image |

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

### AI and Runtime

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | AI Builder chat (optional) |
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
