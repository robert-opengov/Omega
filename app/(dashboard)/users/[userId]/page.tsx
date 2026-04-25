import { gabTenantRepo, gabUserRepo } from '@/lib/core';
import { Card, CardContent } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { UserEditForm } from '../_components/UserEditForm';
import type { GabUser } from '@/lib/core/ports/user.repository';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  let user: GabUser | null = null;
  let tenantName: string | null = null;
  let loadError: string | null = null;

  try {
    user = await gabUserRepo.getUser(userId);
    if (user.tenantId) {
      try {
        const tenant = await gabTenantRepo.getTenant(user.tenantId);
        tenantName = tenant.name;
      } catch {
        // Tenant lookup is non-essential — fall back to id.
      }
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load user';
  }

  if (loadError || !user) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">
                Could not load user
              </Text>
              <Text size="xs" color="muted">
                {loadError ?? 'User not found'}
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <UserEditForm user={user} tenantName={tenantName} />;
}
