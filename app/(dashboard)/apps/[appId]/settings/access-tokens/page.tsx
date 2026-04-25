import { gabPublicAccessRepo, gabAppRoleRepo } from '@/lib/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { AccessTokensPanel } from './_components/AccessTokensPanel';

export default async function AccessTokensPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  let tokens: Awaited<ReturnType<typeof gabPublicAccessRepo.listTokens>> = { tokens: [] };
  let roles: Awaited<ReturnType<typeof gabAppRoleRepo.listRoles>> = { items: [], total: 0 };
  let loadError: string | null = null;
  try {
    [tokens, roles] = await Promise.all([
      gabPublicAccessRepo.listTokens(appId),
      gabAppRoleRepo.listRoles(appId).catch(() => ({ items: [], total: 0 })),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load access tokens';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load access tokens</Text>
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
        title="Access tokens"
        description="API tokens scoped to this app. Bind a role to grant role-level permissions."
        condensed
      />
      <Card>
        <CardHeader>
          <CardTitle>Tokens</CardTitle>
          <CardDescription>
            The full secret is shown only once at creation. Treat it like a password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessTokensPanel
            appId={appId}
            initialTokens={tokens.tokens}
            roles={roles.items.map((r) => ({ id: r.id, name: r.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
