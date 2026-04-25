'use server';

import { revalidatePath } from 'next/cache';
import { gabAppRoleRepo } from '@/lib/core';
import type {
  AppUser,
  BulkSetFieldPermissionsRequest,
  CapabilityRecord,
  CreateAppRoleParams,
  FieldAccess,
  FieldPermission,
  GabAppRole,
  RolePermission,
  RowFilterConfig,
  SetCapabilitiesRequest,
  SetPermissionRequest,
  SetRowFilterRequest,
  UpdateAppRoleParams,
  UserRoleAssignment,
} from '@/lib/core/ports/app-role.repository';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function fail<T>(scope: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed to ${scope}.`;
  console.error(`${scope} error:`, message);
  return { success: false, error: message };
}

function bumpRolesPath(appId: string) {
  revalidatePath(`/apps/${appId}/roles`);
}

// -- Roles --------------------------------------------------------------

export async function listAppRolesAction(
  appId: string,
): Promise<ActionResult<{ items: GabAppRole[]; total: number }>> {
  try {
    return { success: true, data: await gabAppRoleRepo.listRoles(appId) };
  } catch (err) {
    return fail('listAppRolesAction', err);
  }
}

export async function createAppRoleAction(
  appId: string,
  params: CreateAppRoleParams,
): Promise<ActionResult<GabAppRole>> {
  try {
    const data = await gabAppRoleRepo.createRole(appId, params);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('createAppRoleAction', err);
  }
}

export async function getAppRoleAction(
  appId: string,
  roleId: string,
): Promise<ActionResult<GabAppRole>> {
  try {
    return { success: true, data: await gabAppRoleRepo.getRole(appId, roleId) };
  } catch (err) {
    return fail('getAppRoleAction', err);
  }
}

export async function updateAppRoleAction(
  appId: string,
  roleId: string,
  params: UpdateAppRoleParams,
): Promise<ActionResult<GabAppRole>> {
  try {
    const data = await gabAppRoleRepo.updateRole(appId, roleId, params);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('updateAppRoleAction', err);
  }
}

export async function deleteAppRoleAction(
  appId: string,
  roleId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabAppRoleRepo.deleteRole(appId, roleId);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('deleteAppRoleAction', err);
  }
}

// -- Table permissions -------------------------------------------------

export async function listRolePermissionsAction(
  appId: string,
  roleId: string,
): Promise<ActionResult<{ items: RolePermission[]; total: number }>> {
  try {
    return { success: true, data: await gabAppRoleRepo.listRolePermissions(appId, roleId) };
  } catch (err) {
    return fail('listRolePermissionsAction', err);
  }
}

export async function setRolePermissionAction(
  appId: string,
  roleId: string,
  tableId: string,
  payload: SetPermissionRequest,
): Promise<ActionResult<RolePermission>> {
  try {
    const data = await gabAppRoleRepo.setRolePermission(appId, roleId, tableId, payload);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('setRolePermissionAction', err);
  }
}

// -- Field permissions -------------------------------------------------

export async function listFieldPermissionsAction(
  appId: string,
  roleId: string,
  tableId: string,
): Promise<ActionResult<{ items: FieldPermission[]; total: number }>> {
  try {
    return {
      success: true,
      data: await gabAppRoleRepo.listFieldPermissions(appId, roleId, tableId),
    };
  } catch (err) {
    return fail('listFieldPermissionsAction', err);
  }
}

export async function setFieldPermissionAction(
  appId: string,
  roleId: string,
  tableId: string,
  fieldId: string,
  access: FieldAccess,
): Promise<ActionResult<FieldPermission>> {
  try {
    const data = await gabAppRoleRepo.setFieldPermission(
      appId,
      roleId,
      tableId,
      fieldId,
      access,
    );
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('setFieldPermissionAction', err);
  }
}

export async function setFieldPermissionsBulkAction(
  appId: string,
  roleId: string,
  tableId: string,
  payload: BulkSetFieldPermissionsRequest,
): Promise<ActionResult<{ items: FieldPermission[]; total: number }>> {
  try {
    const data = await gabAppRoleRepo.setFieldPermissionsBulk(appId, roleId, tableId, payload);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('setFieldPermissionsBulkAction', err);
  }
}

// -- Row filter --------------------------------------------------------

export async function getRowFilterAction(
  appId: string,
  roleId: string,
  tableId: string,
): Promise<
  ActionResult<{
    viewFilterConfig: RowFilterConfig | null;
    editFilterConfig: RowFilterConfig | null;
    deleteFilterConfig: RowFilterConfig | null;
  }>
> {
  try {
    return { success: true, data: await gabAppRoleRepo.getRowFilter(appId, roleId, tableId) };
  } catch (err) {
    return fail('getRowFilterAction', err);
  }
}

export async function setRowFilterAction(
  appId: string,
  roleId: string,
  tableId: string,
  payload: SetRowFilterRequest,
): Promise<ActionResult<RolePermission>> {
  try {
    const data = await gabAppRoleRepo.setRowFilter(appId, roleId, tableId, payload);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('setRowFilterAction', err);
  }
}

// -- Capabilities ------------------------------------------------------

export async function listCapabilitiesAction(
  appId: string,
  roleId: string,
  tableId: string,
): Promise<ActionResult<{ items: CapabilityRecord[]; total: number }>> {
  try {
    return {
      success: true,
      data: await gabAppRoleRepo.listCapabilities(appId, roleId, tableId),
    };
  } catch (err) {
    return fail('listCapabilitiesAction', err);
  }
}

export async function setCapabilitiesAction(
  appId: string,
  roleId: string,
  tableId: string,
  payload: SetCapabilitiesRequest,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabAppRoleRepo.setCapabilities(appId, roleId, tableId, payload);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('setCapabilitiesAction', err);
  }
}

// -- User-role assignments --------------------------------------------

export async function listAllUserRolesAction(
  appId: string,
): Promise<ActionResult<{ items: UserRoleAssignment[]; total: number }>> {
  try {
    return { success: true, data: await gabAppRoleRepo.listAllUserRoles(appId) };
  } catch (err) {
    return fail('listAllUserRolesAction', err);
  }
}

export async function listUserRolesAction(
  appId: string,
  userId: string,
): Promise<ActionResult<{ items: UserRoleAssignment[]; total: number }>> {
  try {
    return { success: true, data: await gabAppRoleRepo.listUserRoles(appId, userId) };
  } catch (err) {
    return fail('listUserRolesAction', err);
  }
}

export async function assignRoleAction(
  appId: string,
  userId: string,
  roleId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabAppRoleRepo.assignRole(appId, userId, roleId);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('assignRoleAction', err);
  }
}

export async function unassignRoleAction(
  appId: string,
  userId: string,
  roleId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabAppRoleRepo.unassignRole(appId, userId, roleId);
    bumpRolesPath(appId);
    return { success: true, data };
  } catch (err) {
    return fail('unassignRoleAction', err);
  }
}

export async function listAppUsersAction(
  appId: string,
): Promise<ActionResult<{ items: AppUser[]; total: number }>> {
  try {
    return { success: true, data: await gabAppRoleRepo.listAppUsers(appId) };
  } catch (err) {
    return fail('listAppUsersAction', err);
  }
}
