import { gabAppRoleRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text, Badge } from '@/components/ui/atoms';
import { AlertCircle, Lock, Users } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui/molecules';

export default async function AppRolesPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  let roles: Awaited<ReturnType<typeof gabAppRoleRepo.listRoles>> = { items: [], total: 0 };
  let loadError: string | null = null;
  try {
    roles = await gabAppRoleRepo.listRoles(appId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load roles';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">Could not load roles</Text>
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
        title="Roles"
        description="Roles defined for this app. Used to scope page, table, and field access."
        condensed
      />
      <Card>
        <CardContent className="p-0">
          {roles.items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                illustration={
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  </div>
                }
                title="No roles yet"
                description="Roles are typically seeded with the app template."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {roles.items.map((role) => (
                <li key={role.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded bg-primary-light flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Text size="sm" weight="medium">{role.name}</Text>
                      {role.isSystem && (
                        <Badge variant="default" size="sm">
                          <Lock className="h-3 w-3 mr-1" />
                          system
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <Text size="xs" color="muted" className="mt-0.5 truncate">
                        {role.description}
                      </Text>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
