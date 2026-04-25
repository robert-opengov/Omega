'use server';

import { revalidatePath } from 'next/cache';
import { gabWorkflowRepo } from '@/lib/core';
import type {
  ListTasksQuery,
  WorkflowTask,
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

function revalidateInbox(appId: string) {
  revalidatePath(`/apps/${appId}/workflows`);
}

export async function listTasksAction(
  appId: string,
  query?: ListTasksQuery,
): Promise<ActionResult<WorkflowTask[]>> {
  try {
    return {
      success: true,
      data: await gabWorkflowRepo.listTasks(appId, query),
    };
  } catch (err) {
    return fail('listTasksAction', err);
  }
}

export async function approveTaskAction(
  appId: string,
  taskId: string,
  payload: { notes?: string } = {},
): Promise<ActionResult<WorkflowTask>> {
  try {
    const data = await gabWorkflowRepo.approveTask(appId, taskId, payload);
    revalidateInbox(appId);
    return { success: true, data };
  } catch (err) {
    return fail('approveTaskAction', err);
  }
}

export async function rejectTaskAction(
  appId: string,
  taskId: string,
  payload: { notes?: string } = {},
): Promise<ActionResult<WorkflowTask>> {
  try {
    const data = await gabWorkflowRepo.rejectTask(appId, taskId, payload);
    revalidateInbox(appId);
    return { success: true, data };
  } catch (err) {
    return fail('rejectTaskAction', err);
  }
}
