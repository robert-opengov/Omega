'use client';

import { useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  ExternalLink,
  Settings,
  Copy,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Text, Input, Switch, Label, Badge, Select } from '@/components/ui/atoms';
import {
  Card,
  DataTable,
  PageHeader,
  Modal,
  EmptyState,
  Sheet,
  Alert,
  ConfirmDialog,
  type Column,
} from '@/components/ui/molecules';
import type { GabPage, PageConfig } from '@/lib/core/ports/pages.repository';
import {
  createPageAction,
  updatePageAction,
  duplicatePageAction,
  deletePageAction,
} from '@/app/actions/pages';
import { PAGE_TEMPLATES } from '@/lib/page-builder/page-templates';

export interface PagesPanelProps {
  appId: string;
  appName: string;
  initialItems: GabPage[];
  total: number;
  schemaLocked?: boolean;
}

export function PagesPanel({
  appId,
  appName,
  initialItems,
  total,
  schemaLocked = false,
}: PagesPanelProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState<GabPage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GabPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  type Row = GabPage & Record<string, unknown>;
  const rows = initialItems as Row[];

  const togglePublic = async (page: GabPage) => {
    if (schemaLocked) return;
    const config: PageConfig = { ...(page.config ?? {}), isPublic: !page.config?.isPublic };
    const res = await updatePageAction(appId, page.key, { config });
    if (!res.success) setError(res.error ?? 'Update failed');
    else router.refresh();
  };

  const onDuplicate = async (page: GabPage) => {
    if (schemaLocked) return;
    const res = await duplicatePageAction(appId, page.key);
    if (!res.success) setError(res.error ?? 'Duplicate failed');
    else router.refresh();
  };

  const onDelete = async (page: GabPage) => {
    const res = await deletePageAction(appId, page.key);
    if (!res.success) setError(res.error ?? 'Delete failed');
    else {
      setDeleteTarget(null);
      router.refresh();
    }
  };

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className="font-medium">{row.name}</span>
          {row.config?.isHomePage && <Badge variant="primary">Home</Badge>}
          {row.config?.isPublic && <Badge variant="success">Public</Badge>}
          {row.config?.hideFromNav && <Badge variant="default">Hidden</Badge>}
        </span>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (row) => <code className="text-xs text-muted-foreground">/{row.slug}</code>,
    },
    {
      key: 'key',
      header: 'Key',
      render: (row) => <code className="text-xs">{row.key}</code>,
    },
    {
      key: 'public',
      header: 'Public',
      render: (row) => (
        <button
          type="button"
          onClick={() => togglePublic(row)}
          disabled={schemaLocked}
          aria-label={row.config?.isPublic ? 'Make private' : 'Make public'}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {row.config?.isPublic ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-0.5 justify-end">
          <Link
            href={`/apps/${appId}/pages/${row.key}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/apps/${appId}/p/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setSettingsTarget(row)}
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            onClick={() => onDuplicate(row)}
            disabled={schemaLocked}
            aria-label="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteTarget(row)}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description={`${appName} — build canvas pages from the same components as the UI Showcase.`}
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            icon={Plus}
            disabled={schemaLocked}
          >
            New page
          </Button>
        }
      />

      {schemaLocked && (
        <Alert variant="warning" title="Schema locked">
          This app&apos;s schema is locked. Page metadata is shown read-only.
        </Alert>
      )}

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create a page from a template, then add blocks in the visual editor."
          action={{ label: 'New page', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <Card>
          <DataTable<Row>
            tableLabel="All pages"
            data={rows}
            columns={columns}
            keyExtractor={(r) => r.id}
          />
          <Text size="xs" color="muted" className="p-2">
            {total} page(s)
          </Text>
        </Card>
      )}

      <CreatePageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        appId={appId}
        existingSlugs={rows.map((r) => r.slug)}
      />

      {settingsTarget && (
        <PageSettingsSheet
          appId={appId}
          page={settingsTarget}
          onClose={() => setSettingsTarget(null)}
          schemaLocked={schemaLocked}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete page?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
      />
    </div>
  );
}

// ─── Create dialog ────────────────────────────────────────────────────────

function CreatePageDialog({
  open,
  onOpenChange,
  appId,
  existingSlugs,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appId: string;
  existingSlugs: string[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>('blank');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const finalSlug = slug.trim() || slugify(name);
    if (existingSlugs.includes(finalSlug)) {
      setError(`Slug "${finalSlug}" is already used.`);
      return;
    }
    const tpl = PAGE_TEMPLATES.find((t) => t.id === templateId) ?? PAGE_TEMPLATES[0]!;
    setLoading(true);
    setError(null);
    const res = await createPageAction(appId, {
      name: name.trim(),
      slug: finalSlug,
      layout: tpl.build(),
    });
    setLoading(false);
    if (res.success && res.data) {
      onOpenChange(false);
      setName('');
      setSlug('');
      setTemplateId('blank');
      router.push(`/apps/${appId}/pages/${res.data.key}/edit`);
      router.refresh();
    } else {
      setError(res.error ?? 'Create failed');
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New page" className="max-w-2xl">
      <div className="space-y-4">
        {error && (
          <Text size="sm" className="text-destructive">
            {error}
          </Text>
        )}
        <div>
          <Label htmlFor="np-name">Name</Label>
          <Input
            id="np-name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setName(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            placeholder="Dashboard"
          />
        </div>
        <div>
          <Label htmlFor="np-slug">Slug (URL path)</Label>
          <Input
            id="np-slug"
            value={slug}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
            placeholder="dashboard"
          />
        </div>
        <div>
          <Label className="mb-2 block">Start from template</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PAGE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={`text-left p-3 rounded border ${
                  templateId === t.id
                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/40'
                }`}
              >
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onCreate} loading={loading} disabled={loading}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Settings sheet ───────────────────────────────────────────────────────

function PageSettingsSheet({
  appId,
  page,
  onClose,
  schemaLocked,
}: {
  appId: string;
  page: GabPage;
  onClose: () => void;
  schemaLocked: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(page.name);
  const [slug, setSlug] = useState(page.slug);
  const [icon, setIcon] = useState(page.icon ?? '');
  const [config, setConfig] = useState<PageConfig>(page.config ?? {});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (schemaLocked) return;
    setSaving(true);
    setErr(null);
    const res = await updatePageAction(appId, page.key, {
      name,
      slug,
      icon: icon || null,
      config,
    });
    setSaving(false);
    if (res.success) {
      router.refresh();
      onClose();
    } else {
      setErr(res.error ?? 'Save failed');
    }
  };

  function setCfg<K extends keyof PageConfig>(k: K, v: PageConfig[K]) {
    setConfig((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Page settings" size="lg">
      <div className="space-y-4">
        {err && (
          <Alert variant="error" onDismiss={() => setErr(null)}>
            {err}
          </Alert>
        )}
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={schemaLocked} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={schemaLocked} />
        </div>
        <div>
          <Label>Icon (Lucide name)</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} disabled={schemaLocked} />
        </div>
        <div>
          <Label>Parent page</Label>
          <Input
            value={config.parentPageKey ?? ''}
            onChange={(e) => setCfg('parentPageKey', e.target.value || undefined)}
            disabled={schemaLocked}
            placeholder="(none)"
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <Toggle
            label="Set as home page"
            checked={Boolean(config.isHomePage)}
            onChange={(v) => setCfg('isHomePage', v)}
            disabled={schemaLocked}
          />
          <Toggle
            label="Require authentication"
            checked={config.requiresAuth ?? true}
            onChange={(v) => setCfg('requiresAuth', v)}
            disabled={schemaLocked}
          />
          <Toggle
            label="Public (shareable link)"
            checked={Boolean(config.isPublic)}
            onChange={(v) => setCfg('isPublic', v)}
            disabled={schemaLocked}
          />
          <Toggle
            label="Hide from navigation"
            checked={Boolean(config.hideFromNav)}
            onChange={(v) => setCfg('hideFromNav', v)}
            disabled={schemaLocked}
          />
          <Toggle
            label="Full-screen (no chrome)"
            checked={Boolean(config.fullScreen)}
            onChange={(v) => setCfg('fullScreen', v)}
            disabled={schemaLocked}
          />
        </div>

        <div className="pt-2 border-t border-border space-y-2">
          <Label>Restrict to roles</Label>
          <Input
            value={(config.rolesAllowed ?? []).join(', ')}
            onChange={(e) =>
              setCfg(
                'rolesAllowed',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            disabled={schemaLocked}
            placeholder="(any role) — e.g. admin, editor"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated role slugs. When set, only viewers with at least
            one of these roles (or app admins) can open the page.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={save}
            loading={saving}
            disabled={saving || schemaLocked}
          >
            Save
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// `Select` is imported above but kept for forward-compat (templates can grow
// to use a typed dropdown). Not re-exported so the bundler tree-shakes if
// unused in production builds.
export const __SELECT_REF = Select;
