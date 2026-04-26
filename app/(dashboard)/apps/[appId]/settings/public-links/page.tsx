import { gabPublicAccessRepo, gabAppRoleRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { PublicLinksPanel } from './_components/PublicLinksPanel';

export default async function PublicLinksPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await featureGuard('app.settings');
  const { appId } = await params;

  let links: Awaited<ReturnType<typeof gabPublicAccessRepo.listLinks>> = { items: [], total: 0 };
  let roles: Awaited<ReturnType<typeof gabAppRoleRepo.listRoles>> = { items: [], total: 0 };
  let loadError: string | null = null;
  try {
    [links, roles] = await Promise.all([
      gabPublicAccessRepo.listLinks(appId),
      gabAppRoleRepo.listRoles(appId).catch(() => ({ items: [], total: 0 })),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load public links';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load public links</Text>
              <Text size="xs" color="muted">{loadError}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public links"
        description="Shareable URLs for forms and pages exposed to anonymous users."
        condensed
      />
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>
            Each link points to a form key or page key. Links can be optionally bound to a role and given a
            submission cap or expiry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PublicLinksPanel
            appId={appId}
            initialLinks={links.items}
            roles={roles.items.map((r) => ({ id: r.id, name: r.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
