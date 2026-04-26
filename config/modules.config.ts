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
  /** /users/metadata — user-metadata schema admin (custom per-user fields) */
  userMetadata: boolean;
  /** /pub/[token] single dispatcher (unified public link entrypoint) */
  publicDispatcher: boolean;
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
  /** App-scoped sidebar nav (coexists with the existing tabs nav). */
  appSidebar: boolean;
  /** /apps/[appId]/dashboards/** — first-class dashboards (list/viewer/builder) */
  dashboards: boolean;
  /** Versions / usage / share / rollback / diff UI on the custom-component editor. */
  customComponentLifecycle: boolean;
  /** Drawer variant of the App Complexity score on the overview page. */
  complexityDrawer: boolean;
  /** Multi-step CSV import wizard (validation preview + per-row error report). */
  csvImportStepper: boolean;
  /** Form templates picker on the "New form" flow. */
  formTemplates: boolean;
}

export interface ServiceModules {
  /** OCR microservice port (used by document widgets / forms). */
  ocr: boolean;
  /** GAB Bedrock AI gateway port (used by AI Builder + assistants). */
  ai: boolean;
  /** In-app AI Assistant drawer (summonable from any page). */
  aiAssistant: boolean;
  /** In-app AI App Builder drawer (modify the current app via tool calls). */
  aiAppBuilder: boolean;
  /** Extended iframe page-SDK methods (relationships, documents, form widget channel). */
  pageSdkExtended: boolean;
}

export interface PageBuilderModules {
  /** Built-in widgets (text, metric-card, data-table, etc.). */
  builtins: boolean;
  /** App-scoped custom components in the palette. */
  customComponents: boolean;
  /** Master flag for the lazy-loaded vertical domain widgets (HealthScorecard, BudgetWaterfall, …). */
  verticalWidgets: boolean;
  /** "Convert to component" wizard on the page editor (block → reusable component). */
  convertToComponent: boolean;
  /** Per-page Share button on the editor toolbar (opens public-links create dialog). */
  pageShare: boolean;
  /** "code" PropDefinition editor + AiCodeDialog (inline AI code generation). */
  codeProp: boolean;
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
    tenants:          envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_TENANTS,          true),
    users:            envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_USERS,            true),
    templates:        envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_TEMPLATES,        true),
    aiBuilder:        envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_AI_BUILDER,       true),
    uiShowcase:       envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_UI_SHOWCASE,      true),
    userMetadata:     envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_USER_METADATA,    true),
    publicDispatcher: envBool(process.env.NEXT_PUBLIC_MODULE_PLATFORM_PUBLIC_DISPATCHER, true),
  },
  app: {
    overview:                 envBool(process.env.NEXT_PUBLIC_MODULE_APP_OVERVIEW,                  true),
    tables:                   envBool(process.env.NEXT_PUBLIC_MODULE_APP_TABLES,                    true),
    relationships:            envBool(process.env.NEXT_PUBLIC_MODULE_APP_RELATIONSHIPS,             true),
    roles:                    envBool(process.env.NEXT_PUBLIC_MODULE_APP_ROLES,                     true),
    notifications:            envBool(process.env.NEXT_PUBLIC_MODULE_APP_NOTIFICATIONS,             true),
    jobs:                     envBool(process.env.NEXT_PUBLIC_MODULE_APP_JOBS,                      true),
    audit:                    envBool(process.env.NEXT_PUBLIC_MODULE_APP_AUDIT,                     true),
    forms:                    envBool(process.env.NEXT_PUBLIC_MODULE_APP_FORMS,                     true),
    reports:                  envBool(process.env.NEXT_PUBLIC_MODULE_APP_REPORTS,                   true),
    pages:                    envBool(process.env.NEXT_PUBLIC_MODULE_APP_PAGES,                     true),
    customComponents:         envBool(process.env.NEXT_PUBLIC_MODULE_APP_CUSTOM_COMPONENTS,         true),
    workflows:                envBool(process.env.NEXT_PUBLIC_MODULE_APP_WORKFLOWS,                 true),
    sandbox:                  envBool(process.env.NEXT_PUBLIC_MODULE_APP_SANDBOX,                   true),
    settings:                 envBool(process.env.NEXT_PUBLIC_MODULE_APP_SETTINGS,                  true),
    // App-scoped sidebar defaults OFF — additive, opt-in until validated.
    appSidebar:               envBool(process.env.NEXT_PUBLIC_MODULE_APP_APP_SIDEBAR,               false),
    dashboards:               envBool(process.env.NEXT_PUBLIC_MODULE_APP_DASHBOARDS,                true),
    customComponentLifecycle: envBool(process.env.NEXT_PUBLIC_MODULE_APP_CUSTOM_COMPONENT_LIFECYCLE, true),
    complexityDrawer:         envBool(process.env.NEXT_PUBLIC_MODULE_APP_COMPLEXITY_DRAWER,         true),
    csvImportStepper:         envBool(process.env.NEXT_PUBLIC_MODULE_APP_CSV_IMPORT_STEPPER,        true),
    formTemplates:            envBool(process.env.NEXT_PUBLIC_MODULE_APP_FORM_TEMPLATES,            true),
  },
  services: {
    ocr:             envBool(process.env.NEXT_PUBLIC_MODULE_SERVICES_OCR,                true),
    ai:              envBool(process.env.NEXT_PUBLIC_MODULE_SERVICES_AI,                 true),
    aiAssistant:     envBool(process.env.NEXT_PUBLIC_MODULE_SERVICES_AI_ASSISTANT,       true),
    aiAppBuilder:    envBool(process.env.NEXT_PUBLIC_MODULE_SERVICES_AI_APP_BUILDER,     true),
    pageSdkExtended: envBool(process.env.NEXT_PUBLIC_MODULE_SERVICES_PAGE_SDK_EXTENDED,  true),
  },
  pageBuilder: {
    builtins:           envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_BUILTINS,             true),
    customComponents:   envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_CUSTOM_COMPONENTS,    true),
    verticalWidgets:    envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_VERTICAL_WIDGETS,     true),
    convertToComponent: envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_CONVERT_TO_COMPONENT, true),
    pageShare:          envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_PAGE_SHARE,           true),
    codeProp:           envBool(process.env.NEXT_PUBLIC_MODULE_PAGE_BUILDER_CODE_PROP,            true),
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
