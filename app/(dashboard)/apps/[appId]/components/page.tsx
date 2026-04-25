import { notFound } from 'next/navigation';
import Link from 'next/link';
import { gabCustomComponentRepo } from '@/lib/core';
import { tryGetAppContext } from '@/lib/core/app-context';
import { Text } from '@/components/ui/atoms';
import { Card, DataTable, PageHeader, EmptyState, type Column } from '@/components/ui/molecules';
import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';
import { Pencil, Code2 } from 'lucide-react';

export default async function AppCustomComponentsListPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const ctx = await tryGetAppContext(appId);
  if (!ctx) notFound();

  let items: GabCustomComponent[] = [];
  let total = 0;
  try {
    const res = await gabCustomComponentRepo.listComponents(appId);
    items = res.items;
    total = res.total;
  } catch {
    /* empty */
  }

  type Row = GabCustomComponent & Record<string, unknown>;
  const tableData = items as Row[];

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'key',
      header: 'Key',
      render: (row) => <code className="text-xs">{row.key}</code>,
    },
    {
      key: 'v',
      header: 'Version',
      render: (row) => <span className="text-sm">{row.version}</span>,
    },
    {
      key: 'a',
      header: '',
      render: (row) => (
        <Link
          href={`/apps/${appId}/components/${row.key}/edit`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom components"
        description="React code registered in GAB and reusable in page layouts."
        actions={
          <Link
            href={`/apps/${appId}/pages`}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Code2 className="h-4 w-4" />
            Pages
          </Link>
        }
      />
      {tableData.length === 0 ? (
        <EmptyState
          title="No custom components"
          description="Create custom components from the GAB admin API or a future “new component” flow."
        />
      ) : (
        <Card>
          <DataTable<Row>
            tableLabel="Components"
            data={tableData}
            columns={columns}
            keyExtractor={(r) => r.id}
          />
          <Text size="xs" color="muted" className="p-2">
            {total} component(s)
          </Text>
        </Card>
      )}
    </div>
  );
}
