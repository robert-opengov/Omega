'use client';

import { useState, useTransition, type ComponentType } from 'react';
import {
  Building2,
  Users as UsersIcon,
  Package,
  Bot,
  Blocks,
  LayoutDashboard,
  Table as TableIcon,
  Workflow,
  ScrollText,
  GitBranch,
  Shield,
  Bell,
  ListTree,
  History,
  FormInput,
  BarChart3,
  FileText,
  Puzzle,
  TestTube2,
  Settings as SettingsIcon,
  Sparkles,
  Cpu,
  ToggleLeft,
  RotateCcw,
} from 'lucide-react';
import { Button, Switch, Text, Badge } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  ConfirmDialog,
  Alert,
} from '@/components/ui/molecules';
import { useToast } from '@/providers/toast-provider';
import {
  clearAllModuleOverridesAction,
  clearModuleOverrideAction,
  setModuleOverrideAction,
  type ModuleFlagSnapshot,
} from '@/app/actions/feature-flags';
import type {
  AppModules,
  ModulePath,
  PageBuilderModules,
  PlatformModules,
  ServiceModules,
} from '@/config/modules.config';

// ----------------------------------------------------------------------
// Static descriptors — kept here (rather than in modules.config.ts) so
// the config file stays a pure data declaration. Adding a new module
// requires extending the relevant entry below; the typed `ModulePath`
// union ensures missing keys won't compile.
// ----------------------------------------------------------------------

type Icon = ComponentType<{ className?: string; size?: number }>;
type LeafEntry = { label: string; description: string; icon: Icon };

interface CategoryDescriptor<TLeaf extends string> {
  id: 'platform' | 'app' | 'services' | 'pageBuilder';
  label: string;
  description: string;
  icon: Icon;
  leaves: Record<TLeaf, LeafEntry>;
}

const PLATFORM: CategoryDescriptor<keyof PlatformModules> = {
  id: 'platform',
  label: 'Platform',
  description: 'Top-level destinations available to every signed-in user.',
  icon: SettingsIcon,
  leaves: {
    tenants:    { label: 'Companies',    description: 'Multi-tenant directory at /companies.',                  icon: Building2 },
    users:      { label: 'Users',        description: 'Platform user directory at /users.',                     icon: UsersIcon },
    templates:  { label: 'Templates',    description: 'Template catalog and subscriptions at /templates.',      icon: Package },
    aiBuilder:  { label: 'AI Builder',   description: 'Standalone AI app builder at /ai-builder.',              icon: Bot },
    uiShowcase: { label: 'UI Showcase',  description: 'Atomic component showcase at /ui (developer reference).', icon: Blocks },
  },
};

const APP: CategoryDescriptor<keyof AppModules> = {
  id: 'app',
  label: 'Per-app modules',
  description: 'Tabs visible inside each app at /apps/[appId]/…',
  icon: LayoutDashboard,
  leaves: {
    overview:         { label: 'Overview',         description: 'Landing page with metrics and quick actions.',     icon: LayoutDashboard },
    tables:           { label: 'Tables',           description: 'Schema design + record browsing.',                  icon: TableIcon },
    relationships:    { label: 'Relationships',    description: 'Visual ER diagram of cross-table links.',           icon: GitBranch },
    roles:            { label: 'Roles',            description: 'Role-based access control matrix.',                 icon: Shield },
    notifications:    { label: 'Notifications',    description: 'Notification rules + delivery logs.',               icon: Bell },
    jobs:             { label: 'Jobs',             description: 'Scheduled and one-off background jobs.',            icon: ListTree },
    audit:            { label: 'Audit log',        description: 'Append-only history of system events.',             icon: History },
    forms:            { label: 'Forms',            description: 'Public + internal form builder/runtime.',           icon: FormInput },
    reports:          { label: 'Reports',          description: 'Saved analytics dashboards.',                       icon: BarChart3 },
    pages:            { label: 'Pages',            description: 'Page builder + runtime page viewer.',               icon: FileText },
    customComponents: { label: 'Custom components',description: 'App-scoped React components for the page builder.', icon: Puzzle },
    workflows:        { label: 'Workflows',        description: 'BPMN-style workflow definitions and runs.',         icon: Workflow },
    sandbox:          { label: 'Sandbox',          description: 'Per-app developer sandbox.',                        icon: TestTube2 },
    settings:         { label: 'Settings',         description: 'App-level settings (general, tokens, backups…).',   icon: SettingsIcon },
  },
};

const SERVICES: CategoryDescriptor<keyof ServiceModules> = {
  id: 'services',
  label: 'Backend services',
  description: 'Optional adapters wired into the hexagonal data layer.',
  icon: Cpu,
  leaves: {
    ocr: { label: 'OCR service',        description: 'OCR microservice consumed by document widgets and forms.', icon: ScrollText },
    ai:  { label: 'AI gateway',         description: 'GAB Bedrock AI gateway used by AI Builder + assistants.',   icon: Sparkles },
  },
};

const PAGE_BUILDER: CategoryDescriptor<keyof PageBuilderModules> = {
  id: 'pageBuilder',
  label: 'Page builder',
  description: 'Master switches for the palette inside the page editor.',
  icon: ToggleLeft,
  leaves: {
    builtins:         { label: 'Built-in widgets',     description: 'Text, metric-card, data-table, chart, etc.',     icon: Puzzle },
    customComponents: { label: 'Custom components',    description: 'Show app-scoped custom components in the palette.', icon: Blocks },
  },
};

const CATEGORIES = [PLATFORM, APP, SERVICES, PAGE_BUILDER] as const;

// ----------------------------------------------------------------------
// Snapshot helpers — keep state derivations in one place so the JSX
// below stays declarative.
// ----------------------------------------------------------------------

function readLeaf(
  modules: ModuleFlagSnapshot['effective'],
  cat: 'platform' | 'app' | 'services' | 'pageBuilder',
  leaf: string,
): boolean {
  const group = modules[cat] as unknown as Record<string, boolean>;
  return Boolean(group?.[leaf]);
}

function totalOverrides(snapshot: ModuleFlagSnapshot): number {
  return Object.keys(snapshot.overrides).length;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export interface ModuleFlagsManagerProps {
  initialSnapshot: ModuleFlagSnapshot;
}

export function ModuleFlagsManager({ initialSnapshot }: ModuleFlagsManagerProps) {
  const [snapshot, setSnapshot] = useState<ModuleFlagSnapshot>(initialSnapshot);
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { addToast } = useToast();

  const overrideCount = totalOverrides(snapshot);

  const handleToggle = (path: ModulePath, nextValue: boolean) => {
    const baseline = readLeaf(snapshot.baseline, ...(path.split('.') as [
      'platform' | 'app' | 'services' | 'pageBuilder',
      string,
    ]));
    startTransition(async () => {
      const action = nextValue === baseline
        ? clearModuleOverrideAction(path)
        : setModuleOverrideAction(path, nextValue);
      const result = await action;
      if (!result.ok) {
        addToast(result.error, 'error');
        return;
      }
      setSnapshot(result.snapshot);
      addToast(
        nextValue === baseline
          ? `Cleared override for ${path}`
          : `Set ${path} = ${nextValue}`,
        'success',
        2500,
      );
    });
  };

  const handleResetAll = () => {
    startTransition(async () => {
      const result = await clearAllModuleOverridesAction();
      setResetOpen(false);
      if (!result.ok) {
        addToast(result.error, 'error');
        return;
      }
      setSnapshot(result.snapshot);
      addToast('All overrides cleared', 'success', 2500);
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Module Flags"
        description="Turn entire features on or off for this browser. Overrides persist until cleared."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || overrideCount === 0}
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset all{overrideCount > 0 ? ` (${overrideCount})` : ''}
          </Button>
        }
      />

      <Alert variant="info" title="How this works">
        <Text size="sm">
          Defaults come from <code>NEXT_PUBLIC_MODULE_*</code> env vars. Toggling a switch here
          writes a per-browser cookie that supersedes the default. Disabled features 404 their
          routes, hide their nav entries, and disappear from the page-builder palette. Reset to
          fall back to the baseline.
        </Text>
      </Alert>

      <div className="space-y-6">
        {CATEGORIES.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            snapshot={snapshot}
            onToggle={handleToggle}
            disabled={pending}
          />
        ))}
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all module overrides?"
        description="Every flag will fall back to the env-baked default. This affects only your browser."
        confirmLabel="Reset all"
        variant="primary"
        loading={pending}
        onConfirm={handleResetAll}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------

interface CategorySectionProps {
  category: typeof CATEGORIES[number];
  snapshot: ModuleFlagSnapshot;
  onToggle: (path: ModulePath, value: boolean) => void;
  disabled: boolean;
}

function CategorySection({ category, snapshot, onToggle, disabled }: CategorySectionProps) {
  const Icon = category.icon;
  const leaves = Object.entries(category.leaves) as Array<[string, LeafEntry]>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div>
            <CardTitle>{category.label}</CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="divide-y divide-border">
          {leaves.map(([leafKey, descriptor]) => {
            const path = `${category.id}.${leafKey}` as ModulePath;
            const effective = readLeaf(snapshot.effective, category.id, leafKey);
            const baseline = readLeaf(snapshot.baseline, category.id, leafKey);
            const overridden = path in snapshot.overrides;
            return (
              <FlagRow
                key={leafKey}
                path={path}
                descriptor={descriptor}
                effective={effective}
                baseline={baseline}
                overridden={overridden}
                disabled={disabled}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface FlagRowProps {
  path: ModulePath;
  descriptor: LeafEntry;
  effective: boolean;
  baseline: boolean;
  overridden: boolean;
  disabled: boolean;
  onToggle: (path: ModulePath, value: boolean) => void;
}

function FlagRow({
  path,
  descriptor,
  effective,
  baseline,
  overridden,
  disabled,
  onToggle,
}: FlagRowProps) {
  const Icon = descriptor.icon;
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Text weight="medium" size="sm">{descriptor.label}</Text>
          {overridden && (
            <Badge variant="warning" size="sm">
              Overridden
            </Badge>
          )}
          <code className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {path}
          </code>
        </div>
        <Text size="xs" color="muted">{descriptor.description}</Text>
        <Text size="xs" color="muted">
          Default: {baseline ? 'On' : 'Off'}
        </Text>
      </div>
      <Switch
        checked={effective}
        disabled={disabled}
        onCheckedChange={(checked) => onToggle(path, checked)}
        aria-label={`Toggle ${descriptor.label}`}
      />
    </div>
  );
}
