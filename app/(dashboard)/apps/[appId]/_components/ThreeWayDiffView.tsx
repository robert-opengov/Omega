'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus, Pencil, AlertTriangle } from 'lucide-react';
import { Badge, Text } from '@/components/ui/atoms';
import type { ThreeWayDiff } from '@/lib/core/ports/template.repository';
import type { SchemaDiff, SchemaDiffEntry } from '@/lib/core/ports/sandbox.repository';

const CATEGORY_LABELS: Record<string, string> = {
  tables: 'Tables',
  fields: 'Fields',
  relationships: 'Relationships',
  forms: 'Forms',
  reports: 'Reports',
  workflows: 'Workflows',
  pages: 'Pages',
  notifications: 'Notifications',
  customComponents: 'Custom components',
  roles: 'Roles',
  rolePermissions: 'Role permissions',
  roleFieldPermissions: 'Role field permissions',
  roleMgmtCapabilities: 'Role mgmt capabilities',
  statuses: 'Statuses',
  publicLinks: 'Public links',
  userMetadataFields: 'User metadata fields',
};

export function ThreeWayDiffView({ diff }: { diff: ThreeWayDiff }) {
  const [tab, setTab] = useState<'migration' | 'template' | 'local'>('migration');
  const active =
    tab === 'migration'
      ? diff.migrationDiff
      : tab === 'template'
        ? diff.templateChanges
        : diff.localChanges;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="inline-flex items-center rounded border border-border p-0.5 bg-muted/40">
        <DiffTab label="Migration" active={tab === 'migration'} onClick={() => setTab('migration')} />
        <DiffTab label="Template since baseline" active={tab === 'template'} onClick={() => setTab('template')} />
        <DiffTab label="Local edits" active={tab === 'local'} onClick={() => setTab('local')} />
      </div>

      {diff.conflicts.count > 0 && (
        <div className="flex items-start gap-2 p-2 rounded bg-warning-light text-warning-text">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <Text size="sm" weight="medium">
              {diff.conflicts.count} conflict{diff.conflicts.count === 1 ? '' : 's'} detected
            </Text>
            <Text size="xs" className="break-all">
              {diff.conflicts.keys.slice(0, 6).join(', ')}
              {diff.conflicts.keys.length > 6 ? '…' : ''}
            </Text>
          </div>
        </div>
      )}

      <DiffSections diff={active} />
    </div>
  );
}

function DiffTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-2.5 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function DiffSections({ diff }: { diff: SchemaDiff }) {
  const groups = Object.entries(CATEGORY_LABELS)
    .map(([category, label]) => ({
      category,
      label,
      entry: (diff[category as keyof SchemaDiff] as SchemaDiffEntry) ?? {
        added: [],
        modified: [],
        removed: [],
      },
    }))
    .filter(
      (g) =>
        g.entry &&
        (g.entry.added.length > 0 ||
          g.entry.modified.length > 0 ||
          g.entry.removed.length > 0),
    );

  if (groups.length === 0) {
    return (
      <div className="rounded border border-dashed border-border p-6 text-center">
        <Text size="sm" color="muted">No changes in this view.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <Section key={g.category} group={g} />
      ))}
    </div>
  );
}

function Section({
  group,
}: {
  group: { label: string; entry: SchemaDiffEntry };
}) {
  const [open, setOpen] = useState(true);
  const { added, modified, removed } = group.entry;

  return (
    <div className="rounded border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/40"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Text size="sm" weight="medium">{group.label}</Text>
        <div className="ml-auto flex items-center gap-1.5">
          {added.length > 0 && (
            <Badge variant="success" size="sm">+{added.length}</Badge>
          )}
          {modified.length > 0 && (
            <Badge variant="info" size="sm">~{modified.length}</Badge>
          )}
          {removed.length > 0 && (
            <Badge variant="danger" size="sm">−{removed.length}</Badge>
          )}
        </div>
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {added.map((row, i) => (
            <Row key={`a${i}`} kind="added" row={row} />
          ))}
          {modified.map((row, i) => (
            <Row key={`m${i}`} kind="modified" row={row.after} />
          ))}
          {removed.map((row, i) => (
            <Row key={`r${i}`} kind="removed" row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  kind,
  row,
}: {
  kind: 'added' | 'modified' | 'removed';
  row: Record<string, unknown>;
}) {
  const label = String(row.name ?? row.key ?? row.id ?? '?');
  const sub = String(row.key ?? row.id ?? '');

  return (
    <div className="px-3 py-2 flex items-center gap-3">
      <span
        className={
          kind === 'added'
            ? 'text-success-text'
            : kind === 'removed'
              ? 'text-danger-text'
              : 'text-info-text'
        }
      >
        {kind === 'added' ? (
          <Plus className="h-3.5 w-3.5" />
        ) : kind === 'removed' ? (
          <Minus className="h-3.5 w-3.5" />
        ) : (
          <Pencil className="h-3.5 w-3.5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <Text size="sm" weight="medium" className="truncate">{label}</Text>
        {sub && sub !== label && (
          <Text size="xs" color="muted" className="font-mono truncate">{sub}</Text>
        )}
      </div>
    </div>
  );
}
