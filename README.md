# GAB Verticals Boilerplate

The atomic "Lego Bucket" foundation for AI-generated government applications (Government App Builder). Fork this repo, configure your branding and data sources, and compose full verticals — 311 apps, Grants portals, Permitting dashboards — from pre-built, accessible components.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| UI Primitives | Radix UI + custom Tailwind (shadcn/ui-style) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| i18n | next-intl (opt-in) |
| Design Tokens | OpenGov Capital Design System v5.5.0 |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 (Next.js core-web-vitals + React Compiler) |
| CI | GitHub Actions (lint, typecheck, build) |

## Getting Started

```bash
# 1. Fork/clone and install
git clone <repo-url> && cd gab-boilerplate
npm install

# 2. Create your local environment file
cp .env.example .env.local
```

Open `.env.local` and set the two required values:

```env
NEXT_PUBLIC_API_URL=https://devapi.ignatius.io
GAB_CLIENT_ID=IAFConsulting
```

Optionally customize branding right away:

```env
NEXT_PUBLIC_APP_NAME="My City Portal"
NEXT_PUBLIC_THEME_PRIMARY="#4B3FFF"
NEXT_PUBLIC_LOGO_URL=https://example.com/logo.svg
```

Start the dev server and explore:

```bash
# 3. Run the dev server (Turbopack)
npm run dev

# 4. Open http://localhost:3000
#    Then visit /ui to browse every available component
```

> **Before you build anything**, visit `/ui` in the dev server. Every atom, molecule, and organism in the library is rendered there with live examples. Compose pages from those — do not create new UI components in your fork.

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

## Project Structure

```
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, theme, providers)
│   ├── page.tsx                # Entry redirect (→ /home or /login)
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   ├── actions/                # Server actions (auth)
│   └── (dashboard)/            # Dashboard route group
│       ├── layout.tsx          # Dashboard shell (sidebar + navbar)
│       ├── home/               # Home / landing page
│       ├── ai-builder/         # AI Builder chat interface
│       ├── grants/             # Grants vertical (feature-flagged)
│       ├── settings/           # App settings
│       └── ui/                 # Component showcase (dev-only)
│           ├── atoms/
│           ├── molecules/
│           └── organisms/
├── components/ui/              # The "Lego Bucket" (atomic design)
│   ├── atoms/                  # 33 primitives
│   ├── molecules/              # 56 composed components
│   ├── organisms/              # 21 complex components
│   └── layouts/                # Page-level layouts (DashboardLayout, AuthLayout, WizardLayout)
├── config/                     # Centralized configuration
│   ├── app.config.ts           # Branding, theme colors, layout, feature flags
│   ├── auth.config.ts          # Auth strategy (server-only: login mode, silent SSO)
│   ├── auth0.config.ts         # Auth0 SSO (client-safe: domain, clientId, audience)
│   ├── gab.config.ts           # GAB API credentials (server-only)
│   ├── routes.config.ts        # Auth route rules (auto-derived from navigation)
│   └── navigation.config.ts    # Sidebar, navbar, and CommandPalette nav items
├── hooks/                      # Shared React hooks
├── lib/                        # Utilities and core logic
│   ├── utils.ts                # cn(), formatting, theme helpers
│   ├── api-client.ts           # Typed fetch wrapper with auth
│   ├── constants.ts            # App-wide constants
│   └── core/                   # Ports & adapters (hexagonal architecture)
│       ├── ports/              # Interfaces (auth, data, schema, child-table)
│       └── adapters/gab-v1/    # GAB v1 API implementations
├── providers/                  # React context providers
│   ├── theme-provider.tsx      # HSL-based dynamic theming
│   ├── auth-provider.tsx       # Authentication state
│   ├── sidebar-provider.tsx    # Sidebar UI state
│   └── toast-provider.tsx      # Toast notifications
├── i18n/                       # next-intl wiring
├── messages/                   # Locale JSON (en.json)
├── types/                      # Shared TypeScript types
├── proxy.ts                    # Auth middleware (route protection)
├── gab-aws-deploy-kit/         # AWS ECS Fargate deployment toolkit
└── public/                     # Static assets
```

## Component Library

All components follow atomic design and live in `components/ui/`. Each is self-contained with Radix UI accessibility, CVA variants, and full dark mode support.

**Browse them all at `/ui` when the dev server is running.**

### Atoms (33)

Avatar, Badge, Button, ButtonGroup, Checkbox, Chip, Code, Heading, IconButton, Input, Kbd, Label, Link, MaskedInput, NavigationProgress, NumberInput, Progress, RadioGroup, Select, SelectionCard, Separator, Skeleton, Slider, Spinner, StatBadge, StatusDot, StatusStep, Switch, Text, Textarea, ThresholdProgress, Toggle, Tooltip

### Molecules (56)

Accordion, ActivityFeed, AddressInput, Alert, AvatarGroup, Banner, Breadcrumbs, BreakdownCard, Card, CategoryGrid, CheckboxTree, CollapsibleTable, Combobox, CommandPalette, ComposeInput, ConfirmDialog, ContentHeader, DashboardWidget, DataTable, DatePicker, DeadlineItem, DropdownMenu, EmptyState, ExpandableListItem, FilePreviewCard, FileUpload, FormField, Hero, InfoCard, LabelValuePair, LabeledProgressRow, List, MentionInput, MetricCard, Modal, OnboardingWizard, PageContent, PageHeader, Pagination, Popover, ProgressSteps, ResponsiveGrid, SearchInput, SectionHeader, Sheet, SsoLoginButton, StatusChecklist, SummaryCard, Tabs, TagInput, Toast, Toolbar, UploadSlot, ValueItem, WizardCard, ZodForm

### Organisms (21)

AIConversation, AIDisclaimer, AIPromptInput, AuthForm, ChartCard, ChildTable, DataGrid, DetailPageHeader, DynamicForm, FilterBuilder, Footer, FullscreenWizard, GanttChart, KanbanBoard, LocationMap, Logo, Navbar, Sidebar, SignupForm, Timeline, WidgetGrid

### Layouts (3)

AuthLayout, DashboardLayout, WizardLayout

## Building in Your Fork

This is a **compose-first** codebase. Forks build pages by assembling existing components, not by creating new ones.

### Rule 1 — Browse before building

Run `npm run dev` and go to `/ui`. Every atom, molecule, and organism is rendered there with live examples. Find the building blocks you need before writing any code.

### Rule 2 — How to add a page

1. Create a file at `app/(dashboard)/my-feature/page.tsx`
2. Import only from the existing component library:

```tsx
import { PageHeader, DataTable, Card, EmptyState } from '@/components/ui/molecules';
import { Button, Badge } from '@/components/ui/atoms';
import { DetailPageHeader } from '@/components/ui/organisms';
```

3. Add the route to `config/navigation.config.ts`:

```ts
{
  href: '/my-feature',
  label: 'My Feature',
  icon: FileText,
  // Optional: gate behind a feature flag
  featureFlag: 'enableMyFeature',
  // Optional: restrict to certain roles
  roles: ['admin'],
}
```

4. If feature-flagged, add the flag to the `AppFeatures` interface and `features` object in `config/app.config.ts`, plus a `NEXT_PUBLIC_ENABLE_MY_FEATURE` env var in `.env.example`.

### Rule 3 — Need a component that doesn't exist?

**Do NOT create UI components in your fork.** Open an issue or submit a request to the boilerplate repository. Components are built and tested here, then made available to all forks. This keeps the Lego Bucket growing centrally and ensures consistency across verticals.

If you need a one-off layout or page-specific composition, that belongs in your page file — not in `components/ui/`.

## Theming

The entire UI derives from a small set of hex colors defined in `config/app.config.ts`. These get decomposed into HSL CSS variables at runtime (`--primary-h`, `--primary-s`, `--primary-l`), so changing one value cascades through all shades, backgrounds, and borders.

Override via environment variables — no code changes required:

```env
# IMPORTANT: hex values must be quoted because # starts a comment in .env files
NEXT_PUBLIC_THEME_PRIMARY="#4B3FFF"
NEXT_PUBLIC_THEME_SECONDARY="#757575"
NEXT_PUBLIC_THEME_SUCCESS="#2E7D32"
NEXT_PUBLIC_THEME_WARNING="#ED6C02"
NEXT_PUBLIC_THEME_DANGER="#D32F2F"
NEXT_PUBLIC_THEME_INFO="#0288D1"
NEXT_PUBLIC_THEME_IN_PROGRESS="#7B1FA2"
```

Default palette is aligned with the **OpenGov Capital Design System v5.5.0**.

Dark mode uses the `@variant dark (&:is(.dark *))` Tailwind v4 pattern and is toggled via the navbar (controlled by the `enableDarkMode` feature flag).

## Authentication

Auth is controlled by three config layers:

### Master switch

Set `AUTH_ENABLED=false` in `.env.local` to disable all auth. Middleware will skip redirects and root `/` always goes to `/home`. Useful for public landing pages or kiosk apps.

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

`AUTH_ENABLE_SILENT_LOGIN=true` will attempt automatic login if the user has an active Auth0 session. Defaults to `true` for `sso` mode, `false` for `both`.

**Config files:** `config/auth.config.ts` (server-only — login mode, silent SSO) and `config/auth0.config.ts` (client-safe — domain, clientId, audience). Never import `auth.config.ts` from client components.

## Feature Flags

Feature flags live in `config/app.config.ts` and are overridable via env vars. They follow two patterns:

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

## Environment Variables

Copy `.env.example` to `.env.local` and configure. The example file is fully commented — below is the complete reference.

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
| `NEXT_PUBLIC_LOGIN_HERO_IMAGE` | `/brand/login.png` | Login page hero image (left panel) |

### Layout

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SHOW_NAVBAR` | `true` | Show top navbar |
| `NEXT_PUBLIC_SHOW_SIDEBAR` | `true` | Show left sidebar |
| `NEXT_PUBLIC_LAYOUT_MODE` | — | Legacy shorthand: `navbar-sidebar` / `navbar-only` / `sidebar-only` / `none` (overrides the booleans above) |

### Auth Strategy (server-only)

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `true` | Master auth switch |
| `AUTH_LOGIN_MODE` | `both` | `password` / `sso` / `both` |
| `AUTH_ENABLE_SILENT_LOGIN` | `true` for sso, `false` for both | Auto-login from active Auth0 session |

### Auth0 SSO (required when login mode includes SSO)

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

## Architecture

The core data layer follows a **hexagonal (ports & adapters)** pattern:

- **Ports** (`lib/core/ports/`) define interfaces for auth, data, schema, and child-table operations
- **Adapters** (`lib/core/adapters/gab-v1/`) implement those ports against the GAB v1 API
- Swapping the backend means writing new adapters — no component changes needed

## AWS Deployment

The `gab-aws-deploy-kit/` folder is a self-contained toolkit for deploying to AWS ECS Fargate. Copy it into any fork, configure three files, and deploy.

**Key concept:** Next.js inlines `NEXT_PUBLIC_*` variables into the client bundle at build time. These go in `deploy-build-args` (passed as Docker `--build-arg`). All other secrets are injected at runtime via SSM Parameter Store and are listed in `deploy-secrets`.

Quick start:

```bash
cd gab-aws-deploy-kit
cp deploy-config.example deploy-config       # AWS profile, region, app name, scaling
cp deploy-secrets.example deploy-secrets     # Secret names (no values)
cp deploy-build-args.example deploy-build-args  # NEXT_PUBLIC_* key=value pairs

./bin/setup.sh                               # Create AWS infrastructure (idempotent)
./bin/secrets.sh import deploy-secrets.values # Seed SSM secrets
./bin/release-prepare.sh                     # Build + scan + push to ECR
./bin/deploy.sh release-xxx                  # Deploy to ECS
```

See [`gab-aws-deploy-kit/README.md`](gab-aws-deploy-kit/README.md) for the full reference (VPC modes, secrets management, scaling, CodeBuild, and all available commands).
