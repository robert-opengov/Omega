import { gabAppRepo, gabSandboxRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text } from '@/components/ui/atoms';
import { AlertCircle } from 'lucide-react';
import { SandboxPanel } from './_components/SandboxPanel';

export default async function SandboxPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  const [appResult, backupsResult] = await Promise.allSettled([
    gabAppRepo.getApp(appId),
    gabSandboxRepo.listBackups(appId),
  ]);

  if (appResult.status === 'rejected') {
    const message =
      appResult.reason instanceof Error ? appResult.reason.message : 'Failed to load app';
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load app</Text>
              <Text size="xs" color="muted">{message}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const app = appResult.value;
  const backups =
    backupsResult.status === 'fulfilled' ? backupsResult.value.items : [];
  const backupsError =
    backupsResult.status === 'rejected'
      ? backupsResult.reason instanceof Error
        ? backupsResult.reason.message
        : 'Failed to load backups'
      : null;

  return (
    <SandboxPanel
      app={app}
      initialBackups={backups}
      backupsError={backupsError}
    />
  );
}
