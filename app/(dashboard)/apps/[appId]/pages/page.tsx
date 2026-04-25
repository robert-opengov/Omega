import { notFound } from 'next/navigation';
import { gabPageRepo } from '@/lib/core';
import { tryGetAppContext } from '@/lib/core/app-context';
import { PagesPanel } from './_components/PagesPanel';

export default async function AppPagesListPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const ctx = await tryGetAppContext(appId);
  if (!ctx) notFound();

  let items: Awaited<ReturnType<typeof gabPageRepo.listPages>>['items'] = [];
  let total = 0;
  try {
    const res = await gabPageRepo.listPages(appId);
    items = res.items;
    total = res.total;
  } catch {
    /* show empty */
  }

  return (
    <PagesPanel appId={appId} appName={ctx.app.name} initialItems={items} total={total} />
  );
}
