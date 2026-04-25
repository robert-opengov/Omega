/**
 * App-role port — full RBAC surface.
 *
 * Mirrors GAB Core's V2 RBAC API
 * (`packages/api-protocol/src/workspace/rbac.api.ts`):
 *   - Roles: CRUD
 *   - Table permissions: CRUD-tier (none/all/custom) per role+table
 *   - Field permissions: read/write/no_access per role+table+field
 *   - Row filter: view/edit/delete configs per role+table
 *   - Capabilities: management capabilities per role+table
 *   - User-role assignments
 *
 * `tableId === '_'` is the documented sentinel for "All tables" entries on
 * permission rows.
 */

export type AccessTier = 'none' | 'all' | 'custom';
export type FieldAccess = 'read' | 'write' | 'no_access';
export type ManagementCapability =
  | 'manage_forms'
  | 'manage_reports'
  | 'import_data'
  | 'view_table'
  | 'view_report';

export interface FilterValueSource {
  /** 'static' = literal value/array; 'user_attribute' = look up on caller. */
  type: 'static' | 'user_attribute' | string;
  /** Static literal value (or `{ from, to }` for between operators). */
  value?: unknown;
  /** User attribute key when `type === 'user_attribute'`. */
  key?: string;
}

export interface FilterCondition {
  fieldKey: string;
  operator: string;
  source: FilterValueSource;
}

export interface RowFilterConfig {
  combinator: 'all' | 'any';
  conditions: FilterCondition[];
}

export interface RolePermission {
  id: string;
  roleId: string;
  /** `null` => "All tables" sentinel row at the role level. */
  tableId: string | null;
  viewAccess: AccessTier;
  editAccess: AccessTier;
  deleteAccess: AccessTier;
  viewFilterConfig: RowFilterConfig | null;
  editFilterConfig: RowFilterConfig | null;
  deleteFilterConfig: RowFilterConfig | null;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** @deprecated kept for backward compat. */
  modifyAccess: AccessTier;
  createdAt: string;
}

export interface FieldPermission {
  id: string;
  roleId: string;
  tableId: string;
  fieldId: string;
  access: FieldAccess;
  createdAt: string;
}

export interface CapabilityRecord {
  id: string;
  roleId: string;
  tableId: string;
  capability: ManagementCapability;
  createdAt: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  createdAt: string;
}

/** App user listing — used by the role assignment UI. */
export interface AppUser {
  /** Membership row id. */
  id: string;
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface SetPermissionRequest {
  viewAccess: AccessTier;
  canAdd: boolean;
  editAccess: AccessTier;
  deleteAccess: AccessTier;
  viewFilterConfig?: RowFilterConfig | null;
  editFilterConfig?: RowFilterConfig | null;
  deleteFilterConfig?: RowFilterConfig | null;
}

export interface SetRowFilterRequest {
  viewFilterConfig: RowFilterConfig | null;
  editFilterConfig: RowFilterConfig | null;
  deleteFilterConfig: RowFilterConfig | null;
}

export interface SetCapabilitiesRequest {
  capabilities: { capability: ManagementCapability; enabled: boolean }[];
}

export interface BulkSetFieldPermissionsRequest {
  permissions: { fieldId: string; access: FieldAccess }[];
}

export interface GabAppRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateAppRoleParams {
  name: string;
  description?: string;
}

export interface UpdateAppRoleParams {
  name?: string;
  description?: string;
}

export interface IGabAppRoleRepository {
  // -- Role CRUD -------------------------------------------------------
  listRoles(appId: string): Promise<{ items: GabAppRole[]; total: number }>;
  createRole(appId: string, params: CreateAppRoleParams): Promise<GabAppRole>;
  getRole(appId: string, roleId: string): Promise<GabAppRole>;
  updateRole(appId: string, roleId: string, params: UpdateAppRoleParams): Promise<GabAppRole>;
  deleteRole(appId: string, roleId: string): Promise<{ ok: boolean }>;

  // -- Table permissions ----------------------------------------------
  listRolePermissions(
    appId: string,
    roleId: string,
  ): Promise<{ items: RolePermission[]; total: number }>;
  setRolePermission(
    appId: string,
    roleId: string,
    tableId: string,
    payload: SetPermissionRequest,
  ): Promise<RolePermission>;

  // -- Field permissions ----------------------------------------------
  listFieldPermissions(
    appId: string,
    roleId: string,
    tableId: string,
  ): Promise<{ items: FieldPermission[]; total: number }>;
  setFieldPermission(
    appId: string,
    roleId: string,
    tableId: string,
    fieldId: string,
    access: FieldAccess,
  ): Promise<FieldPermission>;
  setFieldPermissionsBulk(
    appId: string,
    roleId: string,
    tableId: string,
    payload: BulkSetFieldPermissionsRequest,
  ): Promise<{ items: FieldPermission[]; total: number }>;

  // -- Row filter ------------------------------------------------------
  getRowFilter(
    appId: string,
    roleId: string,
    tableId: string,
  ): Promise<{
    viewFilterConfig: RowFilterConfig | null;
    editFilterConfig: RowFilterConfig | null;
    deleteFilterConfig: RowFilterConfig | null;
  }>;
  setRowFilter(
    appId: string,
    roleId: string,
    tableId: string,
    payload: SetRowFilterRequest,
  ): Promise<RolePermission>;

  // -- Capabilities ----------------------------------------------------
  listCapabilities(
    appId: string,
    roleId: string,
    tableId: string,
  ): Promise<{ items: CapabilityRecord[]; total: number }>;
  setCapabilities(
    appId: string,
    roleId: string,
    tableId: string,
    payload: SetCapabilitiesRequest,
  ): Promise<{ ok: boolean }>;

  // -- User-role assignments ------------------------------------------
  listAllUserRoles(appId: string): Promise<{ items: UserRoleAssignment[]; total: number }>;
  listUserRoles(
    appId: string,
    userId: string,
  ): Promise<{ items: UserRoleAssignment[]; total: number }>;
  assignRole(appId: string, userId: string, roleId: string): Promise<{ ok: boolean }>;
  unassignRole(appId: string, userId: string, roleId: string): Promise<{ ok: boolean }>;

  /** App users — backs the user picker for role assignment. */
  listAppUsers(appId: string): Promise<{ items: AppUser[]; total: number }>;
}
