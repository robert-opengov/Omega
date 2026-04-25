import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Database } from 'lucide-react';
import { Heading, Text } from '@/components/ui/atoms';
import { gabTableRepo } from '@/lib/core';
import { TableTabsNav } from './_components/TableTabsNav';

export default async function TableLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string; tableId: string }>;
}) {
  const { appId, tableId } = await params;

  let table: Awaited<ReturnType<typeof gabTableRepo.getTable>> | null = null;
  try {
    table = await gabTableRepo.getTable(appId, tableId);
  } catch {
    notFound();
  }

  if (!table) notFound();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href={`/apps/${appId}/tables`} className="hover:text-foreground">
            Tables
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{table.name}</span>
        </nav>

        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded bg-primary-light flex items-center justify-center shrink-0">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <Heading as="h2" className="text-lg truncate">{table.name}</Heading>
            <Text size="xs" color="muted" className="font-mono truncate">{table.key}</Text>
          </div>
        </div>

        <TableTabsNav appId={appId} tableId={tableId} />
      </div>

      <div>{children}</div>
    </div>
  );
}
