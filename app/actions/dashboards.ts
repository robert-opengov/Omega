'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { gabDashboardRepo } from '@/lib/core';
import { assertModuleEnabled, FeatureDisabledError } from '@/lib/feature-guards';
import type {
  CreateDashboardPayload,
  Dashboard,
  UpdateDashboardPayload,
} from '@/lib/core/ports/dashboard.repository';

const createSchema = z.object({
  appId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateSchema = z.object({
  appId: z.string().min(1),
  dashboardId: z.string().min(1),
  patch: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    layout: z.unknown().optional(),
  }),
});

const deleteSchema = z.object({
  appId: z.string().min(1),
  dashboardId: z.string().min(1),
});

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: 'flag' | 'validation' };

function mapError(err: unknown): ActionResult<never> {
  if (err instanceof FeatureDisabledError) {
    return { success: false, error: err.message, code: 'flag' };
  }
  if (err instanceof z.ZodError) {
    return {
      success: false,
      error: err.issues.map((i) => i.message).join('; '),
      code: 'validation',
    };
  }
  return {
    success: false,
    error: err instanceof Error ? err.message : 'Unknown error',
  };
}

export async function createDashboardAction(
  raw: z.input<typeof createSchema>,
): Promise<ActionResult<Dashboard>> {
  try {
    await assertModuleEnabled('app.dashboards');
    const { appId, ...payload } = createSchema.parse(raw);
    const created = await gabDashboardRepo.createDashboard(
      appId,
      payload as CreateDashboardPayload,
    );
    revalidatePath(`/apps/${appId}/dashboards`);
    return { success: true, data: created };
  } catch (err) {
    return mapError(err);
  }
}

export async function updateDashboardAction(
  raw: z.input<typeof updateSchema>,
): Promise<ActionResult<Dashboard>> {
  try {
    await assertModuleEnabled('app.dashboards');
    const { appId, dashboardId, patch } = updateSchema.parse(raw);
    const updated = await gabDashboardRepo.updateDashboard(
      appId,
      dashboardId,
      patch as UpdateDashboardPayload,
    );
    revalidatePath(`/apps/${appId}/dashboards`);
    revalidatePath(`/apps/${appId}/dashboards/${dashboardId}`);
    return { success: true, data: updated };
  } catch (err) {
    return mapError(err);
  }
}

export async function deleteDashboardAction(
  raw: z.input<typeof deleteSchema>,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await assertModuleEnabled('app.dashboards');
    const { appId, dashboardId } = deleteSchema.parse(raw);
    const result = await gabDashboardRepo.deleteDashboard(appId, dashboardId);
    revalidatePath(`/apps/${appId}/dashboards`);
    return { success: true, data: result };
  } catch (err) {
    return mapError(err);
  }
}
