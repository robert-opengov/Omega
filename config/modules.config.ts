/**
 * Module / vertical feature catalog — single source of truth for "is this
 * feature turned on for this deployment?".
 *
 * Distinct from `appConfig.features` which holds cosmetic UI toggles
 * (dark mode, navbar logout, signup link). Modules represent whole
 * verticals (Workflows, Reports, OCR, etc.) that can be hidden, removed,
 * or replaced without touching consumer code.
 *
 * ## How to consume
 *
 * Server-side (Server Components, Server Actions, route handlers):
 *   import { featureGuard } from '@/lib/feature-guards';
 *   await featureGuard('app.workflows'); // → notFound() if disabled
 *
 * Client-side (palette filters, conditional UI):
 *   import { isModuleEnabled } from '@/lib/features';
 *   if (isModuleEnabled('platform.aiBuilder')) { ... }
 *
 * For live, override-aware client checks, prefer the `useModuleEnabled`
 * hook from `@/providers/module-flags-provider`.
 *
 * ## Per-leaf override via env
 *
 * Every leaf can be overridden at deploy time with
 * `NEXT_PUBLIC_MODULE_<UPPER_SNAKE_PATH>=true|false`.
 * Example: `NEXT_PUBLIC_MODULE_APP_WORKFLOWS=false` hides the Workflows tab
 * on every app and 404s its route handlers.
 *
 * Defaults: every module ships ON. Edit defaults below to ship a fork
 * with a narrower surface area without setting env vars.
 */

export interface PlatformModules {
  /** /companies — multi-tenant directory */
  tenants: boolean;
  /** /users — platform user directory */
  users: boolean;
  /** /templates — template catalog + subscriptions */
  templates: boolean;
  /** /ai-builder — standalone AI app builder */
  aiBuilder: boolean;
  /** /ui — atomic component showcase */
  uiShowcase: boolean;
}

export interface AppModules {
  /** /apps/[appId] — overview metrics + quick actions */
  overview: boolean;
  /** /apps/[appId]/tables/** */
  tables: boolean;
  /** /apps/[appId]/relationships */
  relationships: boolean;
  /** /apps/[appId]/roles */
  roles: boolean;
  /** /apps/[appId]/notifications/** */
  notifications: boolean;
  /** /apps/[appId]/jobs */
  jobs: boolean;
  /** /apps/[appId]/audit */
  audit: boolean;
  /** /apps/[appId]/forms/** */
  forms: boolean;
  /** /apps/[appId]/reports/** */
  reports: boolean;
  /** /apps/[appId]/pages/** + /p/[slug] runtime viewer */
  pages: boolean;
  /** /apps/[appId]/components/** — custom-component lifecycle */
  customComponents: boolean;
  /** /apps/[appId]/workflows/** */
  workflows: boolean;
  /** /apps/[appId]/sandbox */
  sandbox: boolean;
  /** /apps/[appId]/settings/** */
  settings: boolean;
}

export interface ServiceModules {
  /** OCR microservice port (used by document widgets / forms). */
  ocr: boolean;
  /** GAB Bedrock AI gateway port (used by AI Builder + assistants). */
  ai: boolean;
}

export interface PageBuilderModules {
  /** Built-in widgets (text, metric-card, data-table, etc.). */
  builtins: boolean;
  /** App-scoped custom components in the palette. */
  customComponents: boolean;
}

export interface ModulesConfig {
  platform: PlatformModules;
  app: AppModules;
  services: ServiceModules;
  pageBuilder: PageBuilderModules;
}

/**
 * Resolve a string env var into a boolean. Empty string and undefined fall
 * back to the supplied default.
 */
function envBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return defaultValue;
}

// IMPORTANT: Each `process.env.NEXT_PUBLIC_*` reference must be a STATIC
// member access (not dynamic indexing) so Next.js can inline it at build
// time. The verbose explicit list is intentional.
export const modulesConfig: ModulesConfig = {
  platform: {
    tenants:    envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_TENANTS,    true),
    users:      envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_USERS,      true),
    templates:  envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_TEMPLATES,  true),
    aiBuilder:  envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_AI_BUILDER, true),
    uiShowcase: envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_UI_SHOWCASE, true),
  },
  app: {
    overview:         envBool(process.env.NEXT_PUBLIC_MODULE_APP_OVERVIEW,          true),
    tables:           envBool(process.env.NEXT_PUBLIC_MODULE_APP_TABLES,            true),
    relationships:    envBool(process.env.NEXT_PUBLIC_MODULE_APP_RELATIONSHIPS,     true),
    roles:            envBool(process.env.NEXT_PUBLIC_MODULE_APP_ROLES,             true),
    notifications:    envBool(process.env.NEXT_PUBLIC_MODULE_APP_NOTIFICATIONS,     true),
    jobs:             envBool(process.env.NEXT_PUBLIC_MODULE_APP_JOBS,              true),
    audit:            envBool(process.env.NEXT_PUBLIC_MODULE_APP_AUDIT,             true),
    forms:            envBool(process.env.NEXT_PUBLIC_MODULE_APP_FORMS,             true),
    reports:          envBool(process.env.NEXT_PUBLIC_MODULE_APP_REPORTS,           true),
    pages:            envBool(process.env.NEXT_PUBLIC_MODULE_APP_PAGES,             true),
    customComponents: envBool(process.env.NEXT_PUBLIC_MODULE_APP_CUSTOM_COMPONENTS, true),
    workflows:        envBool(process.env.NEXT_PUBLIC_MODULE_APP_WORKFLOWS,         true),
    sandbox:          envBool(process.env.NEXT_PUBLIC_MODULE_APP_SANDBOX,           true),
    settings:         envBool(process.env.NEXT_PUBLIC_MODULE_APP_SETTINGS,          true),
  },
  services: {
    ocr: envBool(process.env.NEXT_PUBLIC_MODULE_SERVICES_OCR, true),
    ai:  envBool(process.env.NEXT_PUBLIC_MODULE_SERVICES_AI,  true),
  },
  pageBuilder: {
    builtins:         envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_BUILTINS, true),
    customComponents: envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_CUSTOM_COMPONENTS, true),
  },
};

/**
 * Union of every valid dotted-path module flag — kept in sync with
 * `ModulesConfig`. Used by `isModuleEnabled`/`featureGuard` to reject
 * typos at compile time.
 */
export type ModulePath =
  | `platform.${keyof PlatformModules}`
  | `app.${keyof AppModules}`
  | `services.${keyof ServiceModules}`
  | `pageBuilder.${keyof PageBuilderModules}`;
