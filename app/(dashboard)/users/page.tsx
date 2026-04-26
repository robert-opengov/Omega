import { gabTenantRepo, gabUserRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { Card, CardContent } from '@/components/ui/molecules';
import { AlertCircle } from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { UsersPanel } from './_components/UsersPanel';
import type {
  GabUser,
  ListUsersQuery,
} from '@/lib/core/ports/user.repository';
import type { GabTenant } from '@/lib/core/ports/tenant.repository';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    tenantId?: string;
    active?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await featureGuard('platform.users');
  const sp = await searchParams;

  const query: ListUsersQuery = {
    search: sp.search || undefined,
    tenantId: sp.tenantId || undefined,
    active:
      sp.active === 'true' ? true : sp.active === 'false' ? false : undefined,
    page: sp.page ? Number(sp.page) : 1,
    pageSize: sp.pageSize ? Number(sp.pageSize) : 25,
  };

  let users: GabUser[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 25;
  let tenants: GabTenant[] = [];
  let loadError: string | null = null;

  try {
    const [usersRes, tenantsRes] = await Promise.all([
      gabUserRepo.listUsers(query),
      gabTenantRepo.listTenants().catch(() => ({ items: [], total: 0 })),
    ]);
    users = usersRes.items;
    total = usersRes.total;
    page = usersRes.page;
    pageSize = usersRes.pageSize;
    tenants = tenantsRes.items;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load users';
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger-text mt-0.5 shrink-0" />
            <div>
              <Text weight="medium" size="sm">
                Could not load users
              </Text>
              <Text size="xs" color="muted">
                {loadError}
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <UsersPanel
      users={users}
      total={total}
      page={page}
      pageSize={pageSize}
      tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
