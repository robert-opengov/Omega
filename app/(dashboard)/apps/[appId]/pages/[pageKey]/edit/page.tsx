import { notFound } from 'next/navigation';
import { gabPageRepo, gabCustomComponentRepo } from '@/lib/core';
import { tryGetAppContext } from '@/lib/core/app-context';
import { PageEditorClient } from '@/components/_custom/page-builder/PageEditorClient';

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ appId: string; pageKey: string }>;
}) {
  const { appId, pageKey } = await params;
  const ctx = await tryGetAppContext(appId);
  if (!ctx) notFound();

  // Fetch the page and the app's custom-component palette in parallel so the
  // editor renders with both ready on first paint.
  const [pageResult, customResult] = await Promise.allSettled([
    gabPageRepo.getPage(appId, pageKey),
    gabCustomComponentRepo.listComponents(appId),
  ]);

  if (pageResult.status === 'rejected') notFound();
  const page = pageResult.value;
  const customComponents =
    customResult.status === 'fulfilled' ? customResult.value.items : [];

  return (
    <PageEditorClient
      appId={appId}
      page={page}
      schemaLocked={ctx.schemaLocked}
      customComponents={customComponents}
    />
  );
}
