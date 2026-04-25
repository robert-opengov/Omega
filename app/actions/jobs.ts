'use server';

import { revalidatePath } from 'next/cache';
import { gabJobRepo } from '@/lib/core';
import type {
  FailedJob,
  RecomputeProgress,
  TableJob,
} from '@/lib/core/ports/job.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail<T>(label: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed: ${label}`;
  console.error(`${label} error:`, message);
  return { success: false, error: message };
}

export async function listFailedJobsAction(
  appId: string,
): Promise<ActionResult<{ items: FailedJob[]; total: number }>> {
  try {
    return { success: true, data: await gabJobRepo.listFailedJobs(appId) };
  } catch (err) {
    return fail('listFailedJobsAction', err);
  }
}

export async function retryFailedJobAction(
  appId: string,
  jobId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabJobRepo.retryFailedJob(appId, jobId);
    revalidatePath(`/apps/${appId}/jobs`);
    return { success: true, data };
  } catch (err) {
    return fail('retryFailedJobAction', err);
  }
}

export async function deleteFailedJobAction(
  appId: string,
  jobId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabJobRepo.deleteFailedJob(appId, jobId);
    revalidatePath(`/apps/${appId}/jobs`);
    return { success: true, data };
  } catch (err) {
    return fail('deleteFailedJobAction', err);
  }
}

export async function clearFailedJobsAction(
  appId: string,
): Promise<ActionResult<{ ok: boolean; cleared: number }>> {
  try {
    const data = await gabJobRepo.clearFailedJobs(appId);
    revalidatePath(`/apps/${appId}/jobs`);
    return { success: true, data };
  } catch (err) {
    return fail('clearFailedJobsAction', err);
  }
}

export async function recomputeAllAction(
  appId: string,
): Promise<ActionResult<{ jobId?: string; status?: string }>> {
  try {
    const data = await gabJobRepo.recomputeAll(appId);
    revalidatePath(`/apps/${appId}/jobs`);
    return { success: true, data };
  } catch (err) {
    return fail('recomputeAllAction', err);
  }
}

export async function getRecomputeStatusAction(
  appId: string,
): Promise<ActionResult<RecomputeProgress>> {
  try {
    return { success: true, data: await gabJobRepo.getRecomputeStatus(appId) };
  } catch (err) {
    return fail('getRecomputeStatusAction', err);
  }
}

export async function getTableJobAction(
  appId: string,
  tableId: string,
  jobId: string,
): Promise<ActionResult<TableJob>> {
  try {
    return { success: true, data: await gabJobRepo.getTableJob(appId, tableId, jobId) };
  } catch (err) {
    return fail('getTableJobAction', err);
  }
}
