import { IAuthPort } from '../../ports/auth.port';
import {
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

/**
 * Intentional rollout policy: app-role resource support is being added only
 * for v2 flows in this phase, even though legacy v1 equivalents existed.
 */
function notSupported<T>(): Promise<T> {
  return Promise.reject(new Error('Not supported when GAB_API_VERSION=v1'));
}

export class GabAppRoleV1Adapter implements IGabAppRoleRepository {
  constructor(
    private _authPort: IAuthPort,
    private _apiUrl: string,
  ) {}

  listRoles(_appId: string): Promise<{ items: GabAppRole[]; total: number }> {
    return notSupported();
  }
  createRole(_appId: string, _params: CreateAppRoleParams): Promise<GabAppRole> {
    return notSupported();
  }
  getRole(_appId: string, _roleId: string): Promise<GabAppRole> {
    return notSupported();
  }
  updateRole(
    _appId: string,
    _roleId: string,
    _params: UpdateAppRoleParams,
  ): Promise<GabAppRole> {
    return notSupported();
  }
  deleteRole(_appId: string, _roleId: string): Promise<{ ok: boolean }> {
    return notSupported();
  }
  listRolePermissions(
    _appId: string,
    _roleId: string,
  ): Promise<{ items: RolePermission[]; total: number }> {
    return notSupported();
  }
  setRolePermission(
    _appId: string,
    _roleId: string,
    _tableId: string,
    _payload: SetPermissionRequest,
  ): Promise<RolePermission> {
    return notSupported();
  }
  listFieldPermissions(
    _appId: string,
    _roleId: string,
    _tableId: string,
  ): Promise<{ items: FieldPermission[]; total: number }> {
    return notSupported();
  }
  setFieldPermission(
    _appId: string,
    _roleId: string,
    _tableId: string,
    _fieldId: string,
    _access: FieldAccess,
  ): Promise<FieldPermission> {
    return notSupported();
  }
  setFieldPermissionsBulk(
    _appId: string,
    _roleId: string,
    _tableId: string,
    _payload: BulkSetFieldPermissionsRequest,
  ): Promise<{ items: FieldPermission[]; total: number }> {
    return notSupported();
  }
  getRowFilter(
    _appId: string,
    _roleId: string,
    _tableId: string,
  ): Promise<{
    viewFilterConfig: RowFilterConfig | null;
    editFilterConfig: RowFilterConfig | null;
    deleteFilterConfig: RowFilterConfig | null;
  }> {
    return notSupported();
  }
  setRowFilter(
    _appId: string,
    _roleId: string,
    _tableId: string,
    _payload: SetRowFilterRequest,
  ): Promise<RolePermission> {
    return notSupported();
  }
  listCapabilities(
    _appId: string,
    _roleId: string,
    _tableId: string,
  ): Promise<{ items: CapabilityRecord[]; total: number }> {
    return notSupported();
  }
  setCapabilities(
    _appId: string,
    _roleId: string,
    _tableId: string,
    _payload: SetCapabilitiesRequest,
  ): Promise<{ ok: boolean }> {
    return notSupported();
  }
  listAllUserRoles(
    _appId: string,
  ): Promise<{ items: UserRoleAssignment[]; total: number }> {
    return notSupported();
  }
  listUserRoles(
    _appId: string,
    _userId: string,
  ): Promise<{ items: UserRoleAssignment[]; total: number }> {
    return notSupported();
  }
  assignRole(
    _appId: string,
    _userId: string,
    _roleId: string,
  ): Promise<{ ok: boolean }> {
    return notSupported();
  }
  unassignRole(
    _appId: string,
    _userId: string,
    _roleId: string,
  ): Promise<{ ok: boolean }> {
    return notSupported();
  }
  listAppUsers(_appId: string): Promise<{ items: AppUser[]; total: number }> {
    return notSupported();
  }
}
