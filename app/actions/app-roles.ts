'use server';

import { gabAppRoleRepo } from '@/lib/core';
import type { CreateAppRoleParams, GabAppRole } from '@/lib/core/ports/app-role.repository';

export async function listAppRolesAction(
  appId: string,
): Promise<{ success: boolean; data?: { items: GabAppRole[]; total: number }; error?: string }> {
  try {
    const result = await gabAppRoleRepo.listRoles(appId);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list app roles.';
    console.error('listAppRolesAction error:', message);
    return { success: false, error: message };
  }
}

export async function createAppRoleAction(
  appId: string,
  params: CreateAppRoleParams,
): Promise<{ success: boolean; data?: GabAppRole; error?: string }> {
  try {
    const result = await gabAppRoleRepo.createRole(appId, params);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create app role.';
    console.error('createAppRoleAction error:', message);
    return { success: false, error: message };
  }
}

export async function getAppRoleAction(
  appId: string,
  roleId: string,
): Promise<{ success: boolean; data?: GabAppRole; error?: string }> {
  try {
    const result = await gabAppRoleRepo.getRole(appId, roleId);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get app role.';
    console.error('getAppRoleAction error:', message);
    return { success: false, error: message };
  }
}
