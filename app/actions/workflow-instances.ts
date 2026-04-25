'use server';

import { gabWorkflowRepo } from '@/lib/core';
import type {
  ListInstancesQuery,
  WorkflowInstance,
} from '@/lib/core/ports/workflow.repository';

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

export async function listInstancesAction(
  appId: string,
  query?: ListInstancesQuery,
): Promise<ActionResult<WorkflowInstance[]>> {
  try {
    return {
      success: true,
      data: await gabWorkflowRepo.listInstances(appId, query),
    };
  } catch (err) {
    return fail('listInstancesAction', err);
  }
}

export async function getInstanceAction(
  appId: string,
  instanceId: string,
): Promise<ActionResult<WorkflowInstance>> {
  try {
    return {
      success: true,
      data: await gabWorkflowRepo.getInstance(appId, instanceId),
    };
  } catch (err) {
    return fail('getInstanceAction', err);
  }
}
