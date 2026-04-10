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
| Design Tokens | OpenGov CDS-37 (MUI-based) |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 (Next.js core-web-vitals) |
| CI | GitHub Actions (lint, typecheck, build) |

## Getting Started

```bash
# 1. Clone and install
git clone <repo-url> && cd gab-boilerplate
cp .env.example .env.local   # then fill in real values
npm install

# 2. Run the dev server (Turbopack)
npm run dev

# 3. Open http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint (max 100 warnings) |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

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
│       ├── settings/           # App settings
│       └── ui/                 # Component showcase
│           ├── atoms/
│           ├── molecules/
│           └── organisms/
├── components/ui/              # The "Lego Bucket" (atomic design)
│   ├── atoms/                  # 28 primitives (Button, Input, Badge, AccountNumberInput, etc.)
│   ├── molecules/              # 36 composed components (Card, Modal, Banner, Hero, CheckboxTree, etc.)
│   ├── organisms/              # 13 complex components (Navbar, Sidebar, AuthForm, FlexibleInquiry, Footer, etc.)
│   └── layouts/                # Page-level layouts (DashboardLayout, AuthLayout)
├── config/                     # Centralized configuration
│   ├── app.config.ts           # Branding, theme colors, feature flags
│   ├── gab.config.ts           # GAB API credentials (server-only)
│   ├── routes.config.ts        # Auth route rules
│   └── navigation.config.ts    # Sidebar and navbar navigation items
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
└── public/                     # Static assets
```

## Component Library

All components follow atomic design and live in `components/ui/`. Each is self-contained with Radix UI accessibility, CVA variants, and full dark mode support.

### Atoms (28)

AccountNumberInput, Avatar, Badge, Button, ButtonGroup, Checkbox, Chip, Code, Heading, IconButton, Input, Kbd, Label, Link, NavigationProgress, NumberInput, Progress, RadioGroup, Select, Separator, Skeleton, Slider, Spinner, Switch, Text, Textarea, Toggle, Tooltip

### Molecules (36)

Accordion, Alert, AvatarGroup, Banner, Breadcrumbs, Card, CheckboxTree, Combobox, CommandPalette, ConfirmDialog, DataTable, DatePicker, DropdownMenu, EmptyState/Result, FeatureCard, FilePreviewCard, FileUpload, FormField, Hero, LabelValuePair, List, Modal, OnboardingWizard, PageHeader, Pagination, Popover, ProgressSteps, SearchInput, Sheet, StatsCard, Tabs, TagInput, Timeline, Toast, Toolbar, ZodForm

### Organisms (13)

AIConversation, AIDisclaimer, AIPromptInput, AuthForm, ChartCard, ChildTable (full spreadsheet-like grid with clipboard, DnD, import/export, inline editing), DataGrid, FlexibleInquiry, Footer, Logo, Navbar, Sidebar, SignupForm

Browse them all at `/ui` when the dev server is running.

## Theming

The entire UI derives from a small set of hex colors defined in `config/app.config.ts`. These get decomposed into HSL CSS variables at runtime, so changing one value cascades through all shades, backgrounds, and borders.

Override via environment variables — no code changes required:

```env
NEXT_PUBLIC_THEME_PRIMARY="#4B3FFF"
NEXT_PUBLIC_THEME_SECONDARY="#757575"
NEXT_PUBLIC_THEME_SUCCESS="#2E7D32"
NEXT_PUBLIC_THEME_WARNING="#ED6C02"
NEXT_PUBLIC_THEME_DANGER="#D32F2F"
```

Default palette is aligned with **OpenGov CDS-37** design system.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | GAB API base URL |
| `GAB_CLIENT_ID` | Yes | OAuth client_id for `/token` |
| `GAB_SERVICE_USERNAME` | No | Service account (M2M flows) |
| `GAB_SERVICE_PASSWORD` | No | Service account password |
| `GAB_APP_KEY` | No | App-specific GAB key |
| `NEXT_PUBLIC_APP_NAME` | No | Override app name |
| `NEXT_PUBLIC_APP_DESCRIPTION` | No | Override app description |
| `NEXT_PUBLIC_THEME_*` | No | Override theme colors (hex) |
| `NEXT_PUBLIC_SHOW_NAVBAR` | No | Show top navbar (`true` / `false`, default `true`) |
| `NEXT_PUBLIC_SHOW_SIDEBAR` | No | Show left sidebar (`true` / `false`, default `true`) |
| `NEXT_PUBLIC_LAYOUT_MODE` | No | Legacy shorthand: `navbar-sidebar` / `navbar-only` / `sidebar-only` |
| `OPENAI_API_KEY` | No | AI Builder chat |
| `NODE_ENV` | No | Runtime environment |

## Architecture

The core data layer follows a **hexagonal (ports & adapters)** pattern:

- **Ports** (`lib/core/ports/`) define interfaces for auth, data, schema, and child-table operations
- **Adapters** (`lib/core/adapters/gab-v1/`) implement those ports against the GAB v1 API
- Swapping the backend means writing new adapters — no component changes needed

## The "Lego Bucket" Strategy

This boilerplate is the **component foundation** for AI-generated government verticals. When the AI Builder (or a developer) creates a new vertical:

1. **Fork** this repository
2. **Configure** branding in `config/app.config.ts` or via env vars
3. **Wire** the GAB API keys for the target tables/app
4. **Compose** pages from the existing atoms, molecules, and organisms
5. **Extend** with vertical-specific components as needed

The atomic design ensures consistency across every generated application while keeping each vertical fully customizable.