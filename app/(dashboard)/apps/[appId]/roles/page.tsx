import { gabAppRoleRepo, gabTableRepo } from '@/lib/core';
import { Alert } from '@/components/ui/molecules';
import { RolesPanel } from './_components/RolesPanel';
import type {
  AppUser,
  GabAppRole,
  UserRoleAssignment,
} from '@/lib/core/ports/app-role.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';

export default async function AppRolesPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  let roles: GabAppRole[] = [];
  let userRoles: UserRoleAssignment[] = [];
  let appUsers: AppUser[] = [];
  let tables: GabTable[] = [];
  let loadError: string | null = null;

  try {
    const [rolesRes, urRes, usersRes, tablesRes] = await Promise.all([
      gabAppRoleRepo.listRoles(appId),
      gabAppRoleRepo.listAllUserRoles(appId),
      gabAppRoleRepo.listAppUsers(appId),
      gabTableRepo.listTables(appId),
    ]);
    roles = rolesRes.items;
    userRoles = urRes.items;
    appUsers = usersRes.items;
    tables = tablesRes.items;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load roles';
  }

  if (loadError) {
    return <Alert variant="error" title="Could not load roles">{loadError}</Alert>;
  }

  return (
    <RolesPanel
      appId={appId}
      initialRoles={roles}
      initialUserRoles={userRoles}
      appUsers={appUsers}
      tables={tables.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
