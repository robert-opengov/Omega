import { gabAppRepo, gabAppRoleRepo } from '@/lib/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { NavigationEditor } from './_components/NavigationEditor';
import type { AppNavigation } from '@/lib/core/ports/app.repository';

export default async function AppNavigationSettingsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  let app;
  let roles: { items: { id: string; name: string }[] } = { items: [] };
  let loadError: string | null = null;
  try {
    [app, roles] = await Promise.all([
      gabAppRepo.getApp(appId),
      gabAppRoleRepo.listRoles(appId).catch(() => ({ items: [], total: 0 })),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load navigation.';
  }

  if (loadError || !app) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load navigation</Text>
              <Text size="xs" color="muted">{loadError ?? 'App not found'}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const navigation: AppNavigation = (app.navigation as AppNavigation | null) ?? {
    sidebar: { enabled: true, collapsible: true, title: app.name, items: [] },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigation"
        description="Configure the sidebar items rendered when this app is opened."
        condensed
      />
      <Card>
        <CardHeader>
          <CardTitle>Sidebar items</CardTitle>
          <CardDescription>
            Drag to reorder. Visibility is filtered by role at runtime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NavigationEditor
            appId={appId}
            initialNavigation={navigation}
            roleNames={roles.items.map((r) => r.name)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
