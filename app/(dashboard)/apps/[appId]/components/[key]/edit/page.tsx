import { notFound } from 'next/navigation';
import { gabCustomComponentRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { tryGetAppContext } from '@/lib/core/app-context';
import { CustomComponentEditorClient } from '@/components/_custom/page-builder/CustomComponentEditorClient';

export default async function CustomComponentEditPage({
  params,
}: {
  params: Promise<{ appId: string; key: string }>;
}) {
  await featureGuard('app.customComponents');
  const { appId, key } = await params;
  const ctx = await tryGetAppContext(appId);
  if (!ctx) notFound();

  let comp;
  try {
    comp = await gabCustomComponentRepo.getComponent(appId, key);
  } catch {
    notFound();
  }

  return <CustomComponentEditorClient appId={appId} component={comp} schemaLocked={ctx.schemaLocked} />;
}
