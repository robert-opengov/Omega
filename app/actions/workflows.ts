'use server';

import { revalidatePath } from 'next/cache';
import { gabWorkflowRepo } from '@/lib/core';
import type {
  CreateWorkflowPayload,
  StepTraceResult,
  UpdateWorkflowPayload,
  Workflow,
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

function revalidateWorkflowPaths(appId: string, workflowId?: string) {
  revalidatePath(`/apps/${appId}/workflows`);
  if (workflowId) {
    revalidatePath(`/apps/${appId}/workflows/${workflowId}`);
    revalidatePath(`/apps/${appId}/workflows/${workflowId}/runs`);
  }
}

export async function listWorkflowsAction(
  appId: string,
): Promise<ActionResult<Workflow[]>> {
  try {
    return { success: true, data: await gabWorkflowRepo.listWorkflows(appId) };
  } catch (err) {
    return fail('listWorkflowsAction', err);
  }
}

export async function getWorkflowAction(
  appId: string,
  workflowId: string,
): Promise<ActionResult<Workflow>> {
  try {
    return {
      success: true,
      data: await gabWorkflowRepo.getWorkflow(appId, workflowId),
    };
  } catch (err) {
    return fail('getWorkflowAction', err);
  }
}

export async function createWorkflowAction(
  appId: string,
  payload: CreateWorkflowPayload,
): Promise<ActionResult<Workflow>> {
  try {
    const data = await gabWorkflowRepo.createWorkflow(appId, payload);
    revalidateWorkflowPaths(appId, data.id);
    return { success: true, data };
  } catch (err) {
    return fail('createWorkflowAction', err);
  }
}

export async function updateWorkflowAction(
  appId: string,
  workflowId: string,
  patch: UpdateWorkflowPayload,
): Promise<ActionResult<Workflow>> {
  try {
    const data = await gabWorkflowRepo.updateWorkflow(appId, workflowId, patch);
    revalidateWorkflowPaths(appId, workflowId);
    return { success: true, data };
  } catch (err) {
    return fail('updateWorkflowAction', err);
  }
}

export async function deleteWorkflowAction(
  appId: string,
  workflowId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabWorkflowRepo.deleteWorkflow(appId, workflowId);
    revalidateWorkflowPaths(appId, workflowId);
    return { success: true, data };
  } catch (err) {
    return fail('deleteWorkflowAction', err);
  }
}

export async function testWorkflowAction(
  appId: string,
  workflowId: string,
  recordData: Record<string, unknown>,
): Promise<ActionResult<{ results: StepTraceResult[] }>> {
  try {
    return {
      success: true,
      data: await gabWorkflowRepo.testWorkflow(appId, workflowId, recordData),
    };
  } catch (err) {
    return fail('testWorkflowAction', err);
  }
}
