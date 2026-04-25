import { gabAppRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text } from '@/components/ui/atoms';
import { AlertCircle } from 'lucide-react';
import { AppSettingsForm } from './_components/AppSettingsForm';

export default async function AppSettingsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  let app: Awaited<ReturnType<typeof gabAppRepo.getApp>> | null = null;
  let loadError: string | null = null;
  try {
    app = await gabAppRepo.getApp(appId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load app';
  }

  if (loadError || !app) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load app</Text>
              <Text size="xs" color="muted">{loadError ?? 'Unknown error'}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <AppSettingsForm app={app} />;
}
