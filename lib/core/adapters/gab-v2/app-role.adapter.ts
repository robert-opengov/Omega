import type { IAuthPort } from '../../ports/auth.port';
import type {
  AccessTier,
  AppUser,
  BulkSetFieldPermissionsRequest,
  CapabilityRecord,
  CreateAppRoleParams,
  FieldAccess,
  FieldPermission,
  GabAppRole,
  IGabAppRoleRepository,
  RolePermission,
  RowFilterConfig,
  SetCapabilitiesRequest,
  SetPermissionRequest,
  SetRowFilterRequest,
  UpdateAppRoleParams,
  UserRoleAssignment,
} from '../../ports/app-role.repository';
import { GabV2Http } from './_http';

function asTier(value: unknown): AccessTier {
  return value === 'all' || value === 'custom' ? value : 'none';
}

function asAccess(value: unknown): FieldAccess {
  return value === 'read' || value === 'write' ? value : 'no_access';
}

function normalizeRole(raw: any): GabAppRole {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description ?? null,
    isSystem: Boolean(raw.isSystem),
    createdAt: String(raw.createdAt ?? ''),
  };
}

function normalizeRolePermission(raw: any): RolePermission {
  return {
    id: String(raw.id ?? ''),
    roleId: String(raw.roleId ?? ''),
    tableId: raw.tableId ?? null,
    viewAccess: asTier(raw.viewAccess),
    editAccess: asTier(raw.editAccess),
    deleteAccess: asTier(raw.deleteAccess),
    viewFilterConfig: (raw.viewFilterConfig as RowFilterConfig | null) ?? null,
    editFilterConfig: (raw.editFilterConfig as RowFilterConfig | null) ?? null,
    deleteFilterConfig: (raw.deleteFilterConfig as RowFilterConfig | null) ?? null,
    canView: Boolean(raw.canView),
    canAdd: Boolean(raw.canAdd),
    canEdit: Boolean(raw.canEdit),
    canDelete: Boolean(raw.canDelete),
    modifyAccess: asTier(raw.modifyAccess),
    createdAt: String(raw.createdAt ?? ''),
  };
}

function normalizeFieldPermission(raw: any): FieldPermission {
  return {
    id: String(raw.id ?? ''),
    roleId: String(raw.roleId ?? ''),
    tableId: String(raw.tableId ?? ''),
    fieldId: String(raw.fieldId ?? ''),
    access: asAccess(raw.access),
    createdAt: String(raw.createdAt ?? ''),
  };
}

function normalizeCapability(raw: any): CapabilityRecord {
  return {
    id: String(raw.id ?? ''),
    roleId: String(raw.roleId ?? ''),
    tableId: String(raw.tableId ?? ''),
    capability: raw.capability,
    createdAt: String(raw.createdAt ?? ''),
  };
}

function normalizeUserRole(raw: any): UserRoleAssignment {
  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? ''),
    roleId: String(raw.roleId ?? ''),
    createdAt: String(raw.createdAt ?? ''),
  };
}

export class GabAppRoleV2Adapter implements IGabAppRoleRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  // -- Role CRUD --------------------------------------------------------

  async listRoles(appId: string): Promise<{ items: GabAppRole[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/roles`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeRole) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async createRole(appId: string, params: CreateAppRoleParams): Promise<GabAppRole> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/roles`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return normalizeRole(res);
  }

  async getRole(appId: string, roleId: string): Promise<GabAppRole> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/roles/${roleId}`);
    return normalizeRole(res);
  }

  async updateRole(
    appId: string,
    roleId: string,
    params: UpdateAppRoleParams,
  ): Promise<GabAppRole> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
    return normalizeRole(res);
  }

  async deleteRole(appId: string, roleId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/roles/${roleId}`, { method: 'DELETE' });
    return { ok: true };
  }

  // -- Table permissions -----------------------------------------------

  async listRolePermissions(
    appId: string,
    roleId: string,
  ): Promise<{ items: RolePermission[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/roles/${roleId}/tables`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeRolePermission) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async setRolePermission(
    appId: string,
    roleId: string,
    tableId: string,
    payload: SetPermissionRequest,
  ): Promise<RolePermission> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    );
    return normalizeRolePermission(res);
  }

  // -- Field permissions -----------------------------------------------

  async listFieldPermissions(
    appId: string,
    roleId: string,
    tableId: string,
  ): Promise<{ items: FieldPermission[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}/fields`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeFieldPermission) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async setFieldPermission(
    appId: string,
    roleId: string,
    tableId: string,
    fieldId: string,
    access: FieldAccess,
  ): Promise<FieldPermission> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}/fields/${fieldId}`,
      { method: 'PUT', body: JSON.stringify({ access }) },
    );
    return normalizeFieldPermission(res);
  }

  async setFieldPermissionsBulk(
    appId: string,
    roleId: string,
    tableId: string,
    payload: BulkSetFieldPermissionsRequest,
  ): Promise<{ items: FieldPermission[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}/fields`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeFieldPermission) : [],
      total: Number(res?.total ?? 0),
    };
  }

  // -- Row filter -------------------------------------------------------

  async getRowFilter(
    appId: string,
    roleId: string,
    tableId: string,
  ): Promise<{
    viewFilterConfig: RowFilterConfig | null;
    editFilterConfig: RowFilterConfig | null;
    deleteFilterConfig: RowFilterConfig | null;
  }> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}/row-filter`,
    );
    return {
      viewFilterConfig: res?.viewFilterConfig ?? null,
      editFilterConfig: res?.editFilterConfig ?? null,
      deleteFilterConfig: res?.deleteFilterConfig ?? null,
    };
  }

  async setRowFilter(
    appId: string,
    roleId: string,
    tableId: string,
    payload: SetRowFilterRequest,
  ): Promise<RolePermission> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}/row-filter`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    return normalizeRolePermission(res);
  }

  // -- Capabilities -----------------------------------------------------

  async listCapabilities(
    appId: string,
    roleId: string,
    tableId: string,
  ): Promise<{ items: CapabilityRecord[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}/capabilities`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeCapability) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async setCapabilities(
    appId: string,
    roleId: string,
    tableId: string,
    payload: SetCapabilitiesRequest,
  ): Promise<{ ok: boolean }> {
    await this.http.json(
      `/v2/apps/${appId}/roles/${roleId}/tables/${tableId}/capabilities`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    return { ok: true };
  }

  // -- User-role assignments -------------------------------------------

  async listAllUserRoles(
    appId: string,
  ): Promise<{ items: UserRoleAssignment[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/users/roles`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeUserRole) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async listUserRoles(
    appId: string,
    userId: string,
  ): Promise<{ items: UserRoleAssignment[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/users/${userId}/roles`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeUserRole) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async assignRole(
    appId: string,
    userId: string,
    roleId: string,
  ): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId }),
    });
    return { ok: true };
  }

  async unassignRole(
    appId: string,
    userId: string,
    roleId: string,
  ): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }

  async listAppUsers(appId: string): Promise<{ items: AppUser[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/users`,
    );
    return {
      items: Array.isArray(res?.items)
        ? res.items.map((raw: any) => ({
            id: String(raw.id ?? ''),
            userId: String(raw.userId ?? ''),
            email: String(raw.email ?? ''),
            name: String(raw.name ?? ''),
            createdAt: String(raw.createdAt ?? ''),
          }))
        : [],
      total: Number(res?.total ?? 0),
    };
  }
}
