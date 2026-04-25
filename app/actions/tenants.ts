'use server';

import { revalidatePath } from 'next/cache';
import { gabTenantRepo } from '@/lib/core';
import type {
  CreateTenantPayload,
  GabTenant,
  UpdateTenantPayload,
} from '@/lib/core/ports/tenant.repository';

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

function bumpCompaniesPath(tenantId?: string) {
  revalidatePath('/companies');
  if (tenantId) revalidatePath(`/companies/${tenantId}`);
}

export async function listTenantsAction(): Promise<
  ActionResult<{ items: GabTenant[]; total: number }>
> {
  try {
    return { success: true, data: await gabTenantRepo.listTenants() };
  } catch (err) {
    return fail('listTenantsAction', err);
  }
}

export async function getTenantAction(
  tenantId: string,
): Promise<ActionResult<GabTenant>> {
  try {
    return { success: true, data: await gabTenantRepo.getTenant(tenantId) };
  } catch (err) {
    return fail('getTenantAction', err);
  }
}

export async function createTenantAction(
  payload: CreateTenantPayload,
): Promise<ActionResult<GabTenant>> {
  try {
    const data = await gabTenantRepo.createTenant(payload);
    bumpCompaniesPath();
    return { success: true, data };
  } catch (err) {
    return fail('createTenantAction', err);
  }
}

export async function updateTenantAction(
  tenantId: string,
  payload: UpdateTenantPayload,
): Promise<ActionResult<GabTenant>> {
  try {
    const data = await gabTenantRepo.updateTenant(tenantId, payload);
    bumpCompaniesPath(tenantId);
    return { success: true, data };
  } catch (err) {
    return fail('updateTenantAction', err);
  }
}

export async function deleteTenantAction(
  tenantId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabTenantRepo.deleteTenant(tenantId);
    bumpCompaniesPath(tenantId);
    return { success: true, data };
  } catch (err) {
    return fail('deleteTenantAction', err);
  }
}
