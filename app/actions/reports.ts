'use server';

import { revalidatePath } from 'next/cache';
import { gabReportRepo } from '@/lib/core';
import type {
  CreateReportPayload,
  Report,
  UpdateReportPayload,
} from '@/lib/core/ports/report.repository';

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

function revalidateReportPaths(appId: string, reportId?: string) {
  revalidatePath(`/apps/${appId}/reports`);
  if (reportId) {
    revalidatePath(`/apps/${appId}/reports/${reportId}`);
  }
}

export async function listReportsAction(
  appId: string,
): Promise<ActionResult<Report[]>> {
  try {
    return { success: true, data: await gabReportRepo.listReports(appId) };
  } catch (err) {
    return fail('listReportsAction', err);
  }
}

export async function getReportAction(
  appId: string,
  reportId: string,
): Promise<ActionResult<Report>> {
  try {
    return {
      success: true,
      data: await gabReportRepo.getReport(appId, reportId),
    };
  } catch (err) {
    return fail('getReportAction', err);
  }
}

export async function createReportAction(
  appId: string,
  payload: CreateReportPayload,
): Promise<ActionResult<Report>> {
  try {
    const data = await gabReportRepo.createReport(appId, payload);
    revalidateReportPaths(appId, data.id);
    return { success: true, data };
  } catch (err) {
    return fail('createReportAction', err);
  }
}

export async function updateReportAction(
  appId: string,
  reportId: string,
  patch: UpdateReportPayload,
): Promise<ActionResult<Report>> {
  try {
    const data = await gabReportRepo.updateReport(appId, reportId, patch);
    revalidateReportPaths(appId, reportId);
    return { success: true, data };
  } catch (err) {
    return fail('updateReportAction', err);
  }
}

export async function deleteReportAction(
  appId: string,
  reportId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabReportRepo.deleteReport(appId, reportId);
    revalidateReportPaths(appId, reportId);
    return { success: true, data };
  } catch (err) {
    return fail('deleteReportAction', err);
  }
}
