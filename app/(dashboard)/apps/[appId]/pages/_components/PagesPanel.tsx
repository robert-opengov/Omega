'use client';

import { useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, ExternalLink } from 'lucide-react';
import { Button, Text, Input } from '@/components/ui/atoms';
import { Card, DataTable, PageHeader, Modal, EmptyState, type Column } from '@/components/ui/molecules';
import type { GabPage } from '@/lib/core/ports/pages.repository';
import { createPageAction } from '@/app/actions/pages';

export function PagesPanel({
  appId,
  appName,
  initialItems,
  total,
}: {
  appId: string;
  appName: string;
  initialItems: GabPage[];
  total: number;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type Row = GabPage & Record<string, unknown>;
  const rows = initialItems as Row[];

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (row) => <code className="text-xs text-muted-foreground">{row.slug}</code>,
    },
    {
      key: 'key',
      header: 'Key',
      render: (row) => <code className="text-xs">{row.key}</code>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Link
            href={`/apps/${appId}/pages/${row.key}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/apps/${appId}/p/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  const onCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createPageAction(appId, { name: name.trim(), slug: slug.trim() });
    setLoading(false);
    if (res.success && res.data) {
      setCreateOpen(false);
      setName('');
      setSlug('');
      router.push(`/apps/${appId}/pages/${res.data.key}/edit`);
      router.refresh();
    } else {
      setError(res.error ?? 'Create failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description={`${appName} — build canvas pages from the same components as the UI Showcase.`}
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)} icon={Plus}>
            New page
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create a page, then add blocks in the visual editor."
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

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="New page" className="max-w-md">
        <div className="space-y-3">
          {error && (
            <Text size="sm" className="text-destructive">
              {error}
            </Text>
          )}
          <div>
            <Text size="sm" className="mb-1">Name</Text>
            <Input value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Dashboard" />
          </div>
          <div>
            <Text size="sm" className="mb-1">Slug (URL path)</Text>
            <Input value={slug} onChange={(e: ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)} placeholder="dashboard" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={onCreate} loading={loading} disabled={loading}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
