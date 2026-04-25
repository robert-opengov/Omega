'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Minus } from 'lucide-react';
import { Badge, Text } from '@/components/ui/atoms';
import { getSandboxDiffAction } from '@/app/actions/sandbox';
import type { SchemaDiff, SchemaDiffEntry } from '@/lib/core/ports/sandbox.repository';

interface CategoryGroup {
  category: string;
  label: string;
  entry: SchemaDiffEntry;
}

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

export function SandboxDiffView({ sandboxAppId }: { sandboxAppId: string }) {
  const [diff, setDiff] = useState<SchemaDiff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getSandboxDiffAction(sandboxAppId);
      if (cancelled) return;
      if (!res.success) {
        setError(res.error);
      } else {
        setDiff(res.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sandboxAppId]);

  if (loading) return <Text size="sm" color="muted">Loading diff…</Text>;
  if (error) return <Text size="sm" className="text-danger-text">{error}</Text>;
  if (!diff) return null;

  const groups: CategoryGroup[] = Object.entries(CATEGORY_LABELS)
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

  if (groups.length === 0 && !diff.navigationChanged) {
    return (
      <div className="rounded border border-dashed border-border p-6 text-center">
        <Text size="sm" color="muted">
          No schema differences. The sandbox matches production.
        </Text>
      </div>
    );
  }

  const totals = groups.reduce(
    (acc, g) => ({
      added: acc.added + g.entry.added.length,
      modified: acc.modified + g.entry.modified.length,
      removed: acc.removed + g.entry.removed.length,
    }),
    { added: 0, modified: 0, removed: 0 },
  );

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="success" size="sm">
          <Plus className="h-3 w-3 mr-1" />
          {totals.added} added
        </Badge>
        <Badge variant="info" size="sm">
          <Pencil className="h-3 w-3 mr-1" />
          {totals.modified} modified
        </Badge>
        <Badge variant="danger" size="sm">
          <Minus className="h-3 w-3 mr-1" />
          {totals.removed} removed
        </Badge>
        {diff.navigationChanged && (
          <Badge variant="warning" size="sm">Navigation changed</Badge>
        )}
      </div>

      {groups.map((group) => (
        <CategorySection key={group.category} group={group} />
      ))}
    </div>
  );
}

function CategorySection({ group }: { group: CategoryGroup }) {
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
            <DiffRow key={`a${i}`} kind="added" row={row} />
          ))}
          {modified.map((row, i) => (
            <DiffRow
              key={`m${i}`}
              kind="modified"
              row={{ ...row.after, _key: row.key, _before: row.before }}
            />
          ))}
          {removed.map((row, i) => (
            <DiffRow key={`r${i}`} kind="removed" row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function DiffRow({
  kind,
  row,
}: {
  kind: 'added' | 'modified' | 'removed';
  row: Record<string, unknown>;
}) {
  const label = String(row.name ?? row.key ?? row._key ?? row.id ?? '?');
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
        {kind === 'added' ? <Plus className="h-3.5 w-3.5" /> : kind === 'removed' ? <Minus className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
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
