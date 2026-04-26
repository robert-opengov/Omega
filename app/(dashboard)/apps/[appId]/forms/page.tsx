import { gabFormRepo, gabTableRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { FormsListPanel } from './_components/FormsListPanel';

export default async function AppFormsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await featureGuard('app.forms');
  const { appId } = await params;

  const [formsRes, tablesRes] = await Promise.allSettled([
    gabFormRepo.listForms(appId),
    gabTableRepo.listTables(appId),
  ]);

  const forms = formsRes.status === 'fulfilled' ? formsRes.value.items : [];
  const tables = tablesRes.status === 'fulfilled' ? tablesRes.value.items : [];

  return <FormsListPanel appId={appId} initialForms={forms} tables={tables} />;
}
