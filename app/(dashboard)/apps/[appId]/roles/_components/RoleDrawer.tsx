'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Lock, Settings as SettingsIcon, Sliders, Trash2, UserMinus } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Label,
  Spinner,
  Text,
  Textarea,
} from '@/components/ui/atoms';
import { Alert, ConfirmDialog, Sheet } from '@/components/ui/molecules';
import { listFieldsAction } from '@/app/actions/fields';
import {
  deleteAppRoleAction,
  listAllUserRolesAction,
  listCapabilitiesAction,
  listRolePermissionsAction,
  setCapabilitiesAction,
  setRolePermissionAction,
  setRowFilterAction,
  unassignRoleAction,
  updateAppRoleAction,
} from '@/app/actions/app-roles';
import type {
  AccessTier,
  AppUser,
  CapabilityRecord,
  GabAppRole,
  ManagementCapability,
  RolePermission,
  RowFilterConfig,
  UserRoleAssignment,
} from '@/lib/core/ports/app-role.repository';
import { AccessTierDropdown } from './AccessTierDropdown';
import { CapabilityRow } from './CapabilityRow';
import { FieldPermissionsDrawer } from './FieldPermissionsDrawer';
import { RowFilterBuilder } from './RowFilterBuilder';

type Tab = 'members' | 'tables' | 'settings';

interface FieldRef {
  id: string;
  key: string;
  name: string;
  type: string;
}

interface RoleDrawerProps {
  appId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: GabAppRole;
  tables: { id: string; name: string }[];
  appUsers: AppUser[];
  onChanged: () => void;
}

const TABS: { value: Tab; label: string }[] = [
  { value: 'members', label: 'Members' },
  { value: 'tables', label: 'Table access' },
  { value: 'settings', label: 'Settings' },
];

export function RoleDrawer({
  appId,
  open,
  onOpenChange,
  role,
  tables,
  appUsers,
  onChanged,
}: RoleDrawerProps) {
  const [tab, setTab] = useState<Tab>('members');

  // -- role meta editing -------------------------------------------------
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? '');
  const [savingMeta, startSaveMeta] = useTransition();
  const [metaError, setMetaError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    setName(role.name);
    setDescription(role.description ?? '');
  }, [role.id, role.name, role.description]);

  const onSaveMeta = () => {
    setMetaError(null);
    startSaveMeta(async () => {
      const res = await updateAppRoleAction(appId, role.id, {
        name,
        description: description.trim() ? description : undefined,
      });
      if (!res.success) {
        setMetaError(res.error ?? 'Failed to update role.');
        return;
      }
      onChanged();
    });
  };

  const onDelete = () => {
    startDelete(async () => {
      const res = await deleteAppRoleAction(appId, role.id);
      if (!res.success) {
        setMetaError(res.error ?? 'Failed to delete role.');
        return;
      }
      setConfirmDelete(false);
      onOpenChange(false);
      onChanged();
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          {role.name}
          {role.isSystem && (
            <Badge variant="default" size="sm">
              <Lock className="h-3 w-3 mr-1" /> system
            </Badge>
          )}
        </span>
      }
      description={role.description ?? undefined}
      size="2xl"
      tabs={TABS}
      selectedTab={tab}
      onTabChange={(v) => setTab(v as Tab)}
    >
      {tab === 'members' && (
        <MembersTab
          appId={appId}
          role={role}
          appUsers={appUsers}
          onChanged={onChanged}
        />
      )}
      {tab === 'tables' && (
        <TablesTab
          appId={appId}
          role={role}
          tables={tables}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab
          name={name}
          description={description}
          onName={setName}
          onDescription={setDescription}
          onSave={onSaveMeta}
          saving={savingMeta}
          error={metaError}
          onDelete={() => setConfirmDelete(true)}
          isSystem={role.isSystem}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete role?"
        description={`"${role.name}" will be removed and any users assigned to it will lose this role.`}
        variant="danger"
        confirmLabel={deleting ? 'Deleting…' : 'Delete role'}
        onConfirm={onDelete}
      />
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Members tab
// ---------------------------------------------------------------------------

function MembersTab({
  appId,
  role,
  appUsers,
  onChanged,
}: {
  appId: string;
  role: GabAppRole;
  appUsers: AppUser[];
  onChanged: () => void;
}) {
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();

  const usersById = useMemo(() => {
    const m = new Map<string, AppUser>();
    for (const u of appUsers) m.set(u.userId, u);
    return m;
  }, [appUsers]);

  const reload = () => {
    setLoading(true);
    setError(null);
    listAllUserRolesAction(appId).then((res) => {
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to load assignments.');
      } else {
        setAssignments(res.data.items.filter((a) => a.roleId === role.id));
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, role.id]);

  const onUnassign = (userId: string) => {
    startRemove(async () => {
      const res = await unassignRoleAction(appId, userId, role.id);
      if (!res.success) {
        setError(res.error ?? 'Failed to remove assignment.');
        return;
      }
      reload();
      onChanged();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner size="sm" />
        <Text size="sm" color="muted">Loading members…</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error" title="Error">{error}</Alert>}
      {assignments.length === 0 ? (
        <Text size="sm" color="muted">
          No users have this role yet. Assign users from the Users tab.
        </Text>
      ) : (
        <ul className="divide-y divide-border rounded border border-border overflow-hidden">
          {assignments.map((a) => {
            const user = usersById.get(a.userId);
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-background"
              >
                <div className="min-w-0">
                  <Text size="sm" weight="medium" className="truncate">
                    {user?.name || user?.email || a.userId}
                  </Text>
                  {user?.email && (
                    <Text size="xs" color="muted" className="truncate">
                      {user.email}
                    </Text>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUnassign(a.userId)}
                  disabled={removing}
                  aria-label={`Remove ${user?.name ?? a.userId}`}
                >
                  <UserMinus className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tables tab
// ---------------------------------------------------------------------------

function TablesTab({
  appId,
  role,
  tables,
}: {
  appId: string;
  role: GabAppRole;
  tables: { id: string; name: string }[];
}) {
  const [perms, setPerms] = useState<Record<string, RolePermission>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [activeFieldsTable, setActiveFieldsTable] =
    useState<{ id: string; name: string } | null>(null);
  const [tableFields, setTableFields] = useState<Record<string, FieldRef[]>>({});
  const [activeFilterTable, setActiveFilterTable] =
    useState<{ id: string; name: string } | null>(null);
  const [activeCapabilityTable, setActiveCapabilityTable] =
    useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!role.id) return;
    setLoading(true);
    setError(null);
    listRolePermissionsAction(appId, role.id).then((res) => {
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to load table permissions.');
        setLoading(false);
        return;
      }
      const map: Record<string, RolePermission> = {};
      for (const p of res.data.items) {
        const key = p.tableId ?? '_';
        map[key] = p;
      }
      setPerms(map);
      setLoading(false);
    });
  }, [appId, role.id]);

  const ensureFields = async (tableId: string): Promise<FieldRef[]> => {
    if (tableFields[tableId]) return tableFields[tableId];
    const res = await listFieldsAction(appId, tableId, { includeSystem: false });
    if (!res.success || !res.data) return [];
    const list = res.data.items.map((f) => ({
      id: f.id,
      key: f.key,
      name: f.name,
      type: f.type,
    }));
    setTableFields((prev) => ({ ...prev, [tableId]: list }));
    return list;
  };

  const patchPerm = (tableId: string, patch: Partial<RolePermission>) => {
    setPerms((prev) => {
      const cur = prev[tableId] ?? makeBlankPerm(role.id, tableId);
      return { ...prev, [tableId]: { ...cur, ...patch } };
    });
  };

  const savePermission = (tableId: string) => {
    setError(null);
    const cur = perms[tableId];
    if (!cur) return;
    startSave(async () => {
      const res = await setRolePermissionAction(appId, role.id, tableId, {
        viewAccess: cur.viewAccess,
        canAdd: cur.canAdd,
        editAccess: cur.editAccess,
        deleteAccess: cur.deleteAccess,
        viewFilterConfig: cur.viewFilterConfig,
        editFilterConfig: cur.editFilterConfig,
        deleteFilterConfig: cur.deleteFilterConfig,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to save permission.');
        return;
      }
      setPerms((prev) => ({ ...prev, [tableId]: res.data! }));
    });
  };

  const saveFilter = (tableId: string, payload: {
    viewFilterConfig: RowFilterConfig | null;
    editFilterConfig: RowFilterConfig | null;
    deleteFilterConfig: RowFilterConfig | null;
  }) => {
    setError(null);
    startSave(async () => {
      const res = await setRowFilterAction(appId, role.id, tableId, payload);
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to save row filter.');
        return;
      }
      setPerms((prev) => ({ ...prev, [tableId]: res.data! }));
      setActiveFilterTable(null);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner size="sm" />
        <Text size="sm" color="muted">Loading table permissions…</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error" title="Error">{error}</Alert>}
      {role.isSystem && (
        <Alert variant="info" title="System role">
          Built-in roles like admin always have full access. Editing is disabled.
        </Alert>
      )}
      <div className="rounded border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Table</th>
              <th className="px-3 py-2 text-left font-medium">View</th>
              <th className="px-3 py-2 text-center font-medium">Add</th>
              <th className="px-3 py-2 text-left font-medium">Edit</th>
              <th className="px-3 py-2 text-left font-medium">Delete</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => {
              const p = perms[t.id] ?? makeBlankPerm(role.id, t.id);
              const customCount =
                (p.viewAccess === 'custom' ? 1 : 0) +
                (p.editAccess === 'custom' ? 1 : 0) +
                (p.deleteAccess === 'custom' ? 1 : 0);
              return (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">
                    <div className="flex items-center gap-2">
                      <span>{t.name}</span>
                      {customCount > 0 && (
                        <Badge variant="default" size="sm">
                          {customCount} filter{customCount === 1 ? '' : 's'}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <AccessTierDropdown
                      ariaLabel={`View access for ${t.name}`}
                      value={p.viewAccess}
                      disabled={role.isSystem || saving}
                      onChange={(tier) => {
                        patchPerm(t.id, { viewAccess: tier });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Add records in ${t.name}`}
                      checked={p.canAdd}
                      disabled={role.isSystem || saving}
                      onChange={(e) => patchPerm(t.id, { canAdd: e.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AccessTierDropdown
                      ariaLabel={`Edit access for ${t.name}`}
                      value={p.editAccess}
                      disabled={role.isSystem || saving}
                      onChange={(tier) => patchPerm(t.id, { editAccess: tier })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AccessTierDropdown
                      ariaLabel={`Delete access for ${t.name}`}
                      value={p.deleteAccess}
                      disabled={role.isSystem || saving}
                      onChange={(tier) => patchPerm(t.id, { deleteAccess: tier })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Edit row filters"
                        disabled={role.isSystem}
                        onClick={async () => {
                          await ensureFields(t.id);
                          setActiveFilterTable(t);
                        }}
                      >
                        <Sliders className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Field permissions"
                        onClick={async () => {
                          await ensureFields(t.id);
                          setActiveFieldsTable(t);
                        }}
                      >
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Capabilities"
                        disabled={role.isSystem}
                        onClick={() => setActiveCapabilityTable(t)}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={role.isSystem || saving}
                        onClick={() => savePermission(t.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeFieldsTable && (
        <FieldPermissionsDrawer
          appId={appId}
          roleId={role.id}
          roleName={role.name}
          tableId={activeFieldsTable.id}
          tableName={activeFieldsTable.name}
          fields={tableFields[activeFieldsTable.id] ?? []}
          isSystemRole={role.isSystem}
          open
          onOpenChange={(o) => {
            if (!o) setActiveFieldsTable(null);
          }}
        />
      )}

      {activeFilterTable && (
        <RowFilterDrawer
          appId={appId}
          roleId={role.id}
          tableId={activeFilterTable.id}
          tableName={activeFilterTable.name}
          fields={tableFields[activeFilterTable.id] ?? []}
          initial={perms[activeFilterTable.id] ?? makeBlankPerm(role.id, activeFilterTable.id)}
          onSave={(payload) => saveFilter(activeFilterTable.id, payload)}
          saving={saving}
          onClose={() => setActiveFilterTable(null)}
        />
      )}

      {activeCapabilityTable && (
        <CapabilitiesDrawer
          appId={appId}
          roleId={role.id}
          tableId={activeCapabilityTable.id}
          tableName={activeCapabilityTable.name}
          onClose={() => setActiveCapabilityTable(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capabilities drawer
// ---------------------------------------------------------------------------

function CapabilitiesDrawer({
  appId,
  roleId,
  tableId,
  tableName,
  onClose,
}: {
  appId: string;
  roleId: string;
  tableId: string;
  tableName: string;
  onClose: () => void;
}) {
  const [enabled, setEnabled] = useState<Set<ManagementCapability>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    setLoading(true);
    setError(null);
    listCapabilitiesAction(appId, roleId, tableId).then((res) => {
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to load capabilities.');
      } else {
        setEnabled(new Set(res.data.items.map((c: CapabilityRecord) => c.capability)));
      }
      setLoading(false);
    });
  }, [appId, roleId, tableId]);

  const toggle = (cap: ManagementCapability, on: boolean) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(cap);
      else next.delete(cap);
      return next;
    });
  };

  const onSave = () => {
    setError(null);
    startSave(async () => {
      const allCaps: ManagementCapability[] = [
        'manage_forms',
        'manage_reports',
        'import_data',
        'view_table',
        'view_report',
      ];
      const payload = {
        capabilities: allCaps.map((c) => ({ capability: c, enabled: enabled.has(c) })),
      };
      const res = await setCapabilitiesAction(appId, roleId, tableId, payload);
      if (!res.success) {
        setError(res.error ?? 'Failed to save capabilities.');
        return;
      }
      onClose();
    });
  };

  return (
    <Sheet
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={`Capabilities: ${tableName}`}
      size="lg"
      primaryAction={{ label: saving ? 'Saving…' : 'Save', onClick: onSave }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      {loading ? (
        <div className="flex items-center gap-2 py-6">
          <Spinner size="sm" />
          <Text size="sm" color="muted">Loading…</Text>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error">{error}</Alert>
      ) : (
        <CapabilityRow enabled={enabled} onToggle={toggle} />
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Row-filter drawer
// ---------------------------------------------------------------------------

function RowFilterDrawer({
  appId,
  roleId,
  tableId,
  tableName,
  fields,
  initial,
  onSave,
  saving,
  onClose,
}: {
  appId: string;
  roleId: string;
  tableId: string;
  tableName: string;
  fields: FieldRef[];
  initial: RolePermission;
  onSave: (payload: {
    viewFilterConfig: RowFilterConfig | null;
    editFilterConfig: RowFilterConfig | null;
    deleteFilterConfig: RowFilterConfig | null;
  }) => void;
  saving: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'view' | 'edit' | 'delete'>('view');
  const [view, setView] = useState<RowFilterConfig | null>(initial.viewFilterConfig);
  const [edit, setEdit] = useState<RowFilterConfig | null>(initial.editFilterConfig);
  const [del, setDel] = useState<RowFilterConfig | null>(initial.deleteFilterConfig);

  return (
    <Sheet
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={`Row filter: ${tableName}`}
      description={`Restrict which records this role can ${tab} via conditions.`}
      size="2xl"
      tabs={[
        { value: 'view', label: 'View' },
        { value: 'edit', label: 'Edit' },
        { value: 'delete', label: 'Delete' },
      ]}
      selectedTab={tab}
      onTabChange={(v) => setTab(v as 'view' | 'edit' | 'delete')}
      primaryAction={{
        label: saving ? 'Saving…' : 'Save filters',
        onClick: () =>
          onSave({
            viewFilterConfig: view,
            editFilterConfig: edit,
            deleteFilterConfig: del,
          }),
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      {tab === 'view' && (
        <RowFilterBuilder fields={fields} value={view} onChange={setView} />
      )}
      {tab === 'edit' && (
        <RowFilterBuilder fields={fields} value={edit} onChange={setEdit} />
      )}
      {tab === 'delete' && (
        <RowFilterBuilder fields={fields} value={del} onChange={setDel} />
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Settings tab (rename / delete)
// ---------------------------------------------------------------------------

function SettingsTab({
  name,
  description,
  onName,
  onDescription,
  onSave,
  saving,
  error,
  onDelete,
  isSystem,
}: {
  name: string;
  description: string;
  onName: (v: string) => void;
  onDescription: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  onDelete: () => void;
  isSystem: boolean;
}) {
  return (
    <div className="space-y-4">
      {error && <Alert variant="error" title="Error">{error}</Alert>}
      <div className="space-y-1">
        <Label htmlFor="role-name">Name</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          disabled={isSystem}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="role-desc">Description</Label>
        <Textarea
          id="role-desc"
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          disabled={isSystem}
        />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={onSave} disabled={isSystem || saving} variant="primary">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button
          variant="danger"
          className="ml-auto"
          disabled={isSystem}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete role
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlankPerm(roleId: string, tableId: string): RolePermission {
  const blank: AccessTier = 'none';
  return {
    id: '',
    roleId,
    tableId,
    viewAccess: blank,
    editAccess: blank,
    deleteAccess: blank,
    viewFilterConfig: null,
    editFilterConfig: null,
    deleteFilterConfig: null,
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    modifyAccess: blank,
    createdAt: '',
  };
}
