import { notFound } from 'next/navigation';
import { gabPageRepo } from '@/lib/core';
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

  let page;
  try {
    page = await gabPageRepo.getPage(appId, pageKey);
  } catch {
    notFound();
  }

  return <PageEditorClient appId={appId} page={page} />;
}
