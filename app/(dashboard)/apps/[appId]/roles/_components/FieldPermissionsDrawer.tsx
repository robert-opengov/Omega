'use client';

import { useEffect, useState, useTransition } from 'react';
import { Lock } from 'lucide-react';
import { Badge, Select, Spinner, Text } from '@/components/ui/atoms';
import { Alert, Sheet } from '@/components/ui/molecules';
import {
  listFieldPermissionsAction,
  setFieldPermissionsBulkAction,
} from '@/app/actions/app-roles';
import type {
  FieldAccess,
  FieldPermission,
} from '@/lib/core/ports/app-role.repository';

interface FieldRef {
  id: string;
  key: string;
  name: string;
  type: string;
}

interface FieldPermissionsDrawerProps {
  appId: string;
  roleId: string;
  roleName: string;
  tableId: string;
  tableName: string;
  fields: FieldRef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When the role is admin/system, all permissions are forced to write. */
  isSystemRole?: boolean;
}

const ACCESS_LABELS: Record<FieldAccess, string> = {
  read: 'Read',
  write: 'Write',
  no_access: 'No access',
};

export function FieldPermissionsDrawer({
  appId,
  roleId,
  roleName,
  tableId,
  tableName,
  fields,
  open,
  onOpenChange,
  isSystemRole,
}: FieldPermissionsDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perms, setPerms] = useState<Record<string, FieldAccess>>({});
  const [isSaving, startSave] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setPerms({});
    (async () => {
      const res = await listFieldPermissionsAction(appId, roleId, tableId);
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to load field permissions.');
        setLoading(false);
        return;
      }
      const next: Record<string, FieldAccess> = {};
      for (const f of fields) next[f.id] = 'write';
      for (const p of res.data.items as FieldPermission[]) {
        next[p.fieldId] = p.access;
      }
      setPerms(next);
      setLoading(false);
    })();
  }, [open, appId, roleId, tableId, fields]);

  const setAccess = (fieldId: string, access: FieldAccess) => {
    setPerms((prev) => ({ ...prev, [fieldId]: access }));
  };

  const onSave = () => {
    setError(null);
    startSave(async () => {
      const payload = {
        permissions: fields.map((f) => ({
          fieldId: f.id,
          access: perms[f.id] ?? 'write',
        })),
      };
      const res = await setFieldPermissionsBulkAction(appId, roleId, tableId, payload);
      if (!res.success) {
        setError(res.error ?? 'Failed to save field permissions.');
        return;
      }
      onOpenChange(false);
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Field permissions: ${tableName}`}
      description={`Role: ${roleName}`}
      size="xl"
      primaryAction={
        isSystemRole
          ? undefined
          : { label: isSaving ? 'Saving…' : 'Save changes', onClick: onSave }
      }
      secondaryAction={{ label: 'Cancel', onClick: () => onOpenChange(false) }}
    >
      {loading ? (
        <div className="flex items-center gap-2 py-6">
          <Spinner size="sm" />
          <Text size="sm" color="muted">
            Loading field permissions…
          </Text>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      ) : (
        <div className="space-y-3">
          {isSystemRole && (
            <Alert variant="info" title="System role">
              Admin role permissions cannot be edited. All fields have full write
              access.
            </Alert>
          )}
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Field</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Access</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => {
                  const access = perms[f.id] ?? 'write';
                  return (
                    <tr key={f.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{f.name}</td>
                      <td className="px-3 py-2">
                        <Badge variant="default" size="sm">
                          {f.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {isSystemRole ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Lock className="h-3 w-3" /> {ACCESS_LABELS.write}
                          </span>
                        ) : (
                          <Select
                            selectSize="sm"
                            value={access}
                            onChange={(e) =>
                              setAccess(f.id, e.target.value as FieldAccess)
                            }
                            aria-label={`Access for ${f.name}`}
                            className="w-36 ml-auto"
                          >
                            {(Object.keys(ACCESS_LABELS) as FieldAccess[]).map(
                              (a) => (
                                <option key={a} value={a}>
                                  {ACCESS_LABELS[a]}
                                </option>
                              ),
                            )}
                          </Select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Sheet>
  );
}
