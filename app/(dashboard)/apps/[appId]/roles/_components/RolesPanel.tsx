'use client';

import { useMemo, useState, useTransition } from 'react';
import { Lock, Plus, ShieldCheck, UserPlus, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  Text,
  Textarea,
} from '@/components/ui/atoms';
import {
  Alert,
  Card,
  CardContent,
  EmptyState,
  Modal,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/molecules';
import {
  assignRoleAction,
  createAppRoleAction,
} from '@/app/actions/app-roles';
import type {
  AppUser,
  GabAppRole,
  UserRoleAssignment,
} from '@/lib/core/ports/app-role.repository';
import { RoleDrawer } from './RoleDrawer';

interface RolesPanelProps {
  appId: string;
  initialRoles: GabAppRole[];
  initialUserRoles: UserRoleAssignment[];
  appUsers: AppUser[];
  tables: { id: string; name: string }[];
}

export function RolesPanel({
  appId,
  initialRoles,
  initialUserRoles,
  appUsers,
  tables,
}: RolesPanelProps) {
  const [roles, setRoles] = useState<GabAppRole[]>(initialRoles);
  const [assignments, setAssignments] =
    useState<UserRoleAssignment[]>(initialUserRoles);
  const [activeRole, setActiveRole] = useState<GabAppRole | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assignments) m.set(a.roleId, (m.get(a.roleId) ?? 0) + 1);
    return m;
  }, [assignments]);

  const refreshRoles = async () => {
    // Roles list is small; just re-render on optimistic state for now.
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Define roles, assign users, and configure table CRUD + field-level access for this app."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create role
          </Button>
        }
        condensed
      />

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Roles
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-3.5 w-3.5 mr-1" /> Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardContent className="p-0">
              {roles.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    illustration={
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                      </div>
                    }
                    title="No roles yet"
                    description="Create a role to scope CRUD and field access."
                    actions={[
                      {
                        label: 'Create role',
                        onClick: () => setCreateOpen(true),
                      },
                    ]}
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {roles.map((role) => (
                    <li
                      key={role.id}
                      className="px-4 py-3 flex items-start gap-3 hover:bg-muted/40 cursor-pointer"
                      onClick={() => setActiveRole(role)}
                    >
                      <div className="h-8 w-8 rounded bg-primary-light flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Text size="sm" weight="medium">
                            {role.name}
                          </Text>
                          {role.isSystem && (
                            <Badge variant="default" size="sm">
                              <Lock className="h-3 w-3 mr-1" />
                              system
                            </Badge>
                          )}
                          <Badge variant="default" size="sm" className="ml-auto">
                            {counts.get(role.id) ?? 0} member
                            {(counts.get(role.id) ?? 0) === 1 ? '' : 's'}
                          </Badge>
                        </div>
                        {role.description && (
                          <Text
                            size="xs"
                            color="muted"
                            className="mt-0.5 truncate"
                          >
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
        </TabsContent>

        <TabsContent value="users">
          <UsersTab
            appId={appId}
            roles={roles}
            users={appUsers}
            assignments={assignments}
            onAssigned={(a) => setAssignments((prev) => [...prev, a])}
            onError={setError}
          />
        </TabsContent>
      </Tabs>

      {createOpen && (
        <CreateRoleModal
          appId={appId}
          onClose={() => setCreateOpen(false)}
          onCreated={(role) => {
            setRoles((prev) => [...prev, role]);
            setCreateOpen(false);
            setActiveRole(role);
          }}
        />
      )}

      {activeRole && (
        <RoleDrawer
          appId={appId}
          open
          onOpenChange={(o) => {
            if (!o) {
              setActiveRole(null);
              refreshRoles();
            }
          }}
          role={activeRole}
          tables={tables}
          appUsers={appUsers}
          onChanged={() => {
            // No-op: child drawers update local state via reload calls.
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create role modal
// ---------------------------------------------------------------------------

function CreateRoleModal({
  appId,
  onClose,
  onCreated,
}: {
  appId: string;
  onClose: () => void;
  onCreated: (role: GabAppRole) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const onSubmit = () => {
    setError(null);
    startSubmit(async () => {
      const res = await createAppRoleAction(appId, {
        name,
        description: description.trim() || undefined,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to create role.');
        return;
      }
      onCreated(res.data);
    });
  };

  return (
    <Modal
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Create role"
      description="Roles bundle table and field permissions. You can edit them after creation."
      primaryAction={{
        label: submitting ? 'Creating…' : 'Create role',
        onClick: onSubmit,
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <div className="space-y-3">
        {error && (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        )}
        <div className="space-y-1">
          <Label htmlFor="new-role-name">Name</Label>
          <Input
            id="new-role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Editor"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-role-desc">Description (optional)</Label>
          <Textarea
            id="new-role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Can edit records but not change schema."
          />
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Users tab — single role assignment per user (matches GAB Core behaviour).
// ---------------------------------------------------------------------------

function UsersTab({
  appId,
  roles,
  users,
  assignments,
  onAssigned,
  onError,
}: {
  appId: string;
  roles: GabAppRole[];
  users: AppUser[];
  assignments: UserRoleAssignment[];
  onAssigned: (a: UserRoleAssignment) => void;
  onError: (msg: string | null) => void;
}) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingRoleId, setPendingRoleId] = useState<string>('');
  const [submitting, startSubmit] = useTransition();

  const userRoleMap = useMemo(() => {
    const m = new Map<string, UserRoleAssignment>();
    for (const a of assignments) m.set(a.userId, a);
    return m;
  }, [assignments]);

  const rolesById = useMemo(() => {
    const m = new Map<string, GabAppRole>();
    for (const r of roles) m.set(r.id, r);
    return m;
  }, [roles]);

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <EmptyState
            illustration={
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            }
            title="No users in this app"
            description="Add users at the tenant level to assign roles here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {users.map((u) => {
            const current = userRoleMap.get(u.userId);
            const isPending = pendingUserId === u.userId;
            return (
              <li
                key={u.userId}
                className="px-4 py-3 flex items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <Text size="sm" weight="medium" className="truncate">
                    {u.name || u.email}
                  </Text>
                  <Text size="xs" color="muted" className="truncate">
                    {u.email}
                  </Text>
                </div>

                {current ? (
                  <Badge variant="default" size="sm">
                    {rolesById.get(current.roleId)?.name ?? current.roleId}
                  </Badge>
                ) : (
                  <Text size="xs" color="muted">No role</Text>
                )}

                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Select
                      selectSize="sm"
                      value={pendingRoleId}
                      onChange={(e) => setPendingRoleId(e.target.value)}
                      aria-label="Role"
                    >
                      <option value="">Select role…</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!pendingRoleId || submitting}
                      onClick={() => {
                        onError(null);
                        startSubmit(async () => {
                          const res = await assignRoleAction(
                            appId,
                            u.userId,
                            pendingRoleId,
                          );
                          if (!res.success) {
                            onError(res.error ?? 'Failed to assign role.');
                            return;
                          }
                          onAssigned({
                            id: '',
                            userId: u.userId,
                            roleId: pendingRoleId,
                            createdAt: new Date().toISOString(),
                          });
                          setPendingUserId(null);
                          setPendingRoleId('');
                        });
                      }}
                    >
                      Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPendingUserId(null);
                        setPendingRoleId('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPendingUserId(u.userId);
                      setPendingRoleId(current?.roleId ?? '');
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {current ? 'Change' : 'Assign'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
