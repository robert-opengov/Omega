import { notFound } from 'next/navigation';
import { gabPageRepo } from '@/lib/core';
import { tryGetAppContext } from '@/lib/core/app-context';
import { PageRenderer } from '@/components/_custom/page-builder/PageRenderer';
import { Heading, Text } from '@/components/ui/atoms';
import { collapseLayoutToOneRow, normalizePageLayout } from '@/lib/page-builder/layout-helpers';

export default async function AppPageRuntime({
  params,
}: {
  params: Promise<{ appId: string; slug: string }>;
}) {
  const { appId, slug } = await params;
  const ctx = await tryGetAppContext(appId);
  if (!ctx) notFound();

  const list = await gabPageRepo.listPages(appId);
  const page = list.items.find((p) => p.slug === slug);
  if (!page) notFound();

  const layout = collapseLayoutToOneRow(normalizePageLayout(page.layout));

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <Heading as="h1" className="text-2xl">
          {page.name}
        </Heading>
        <Text size="sm" color="muted" className="font-mono">
          /{slug}
        </Text>
      </div>
      <PageRenderer layout={layout} appId={appId} />
    </div>
  );
}
