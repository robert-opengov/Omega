'use server';

import { revalidatePath } from 'next/cache';
import { gabFormRepo } from '@/lib/core';
import type {
  CreateFormPayload,
  GabForm,
  ListFormsQuery,
  UpdateFormPayload,
} from '@/lib/core/ports/form.repository';

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

function revalidateFormPaths(appId: string, formId?: string) {
  revalidatePath(`/apps/${appId}/forms`);
  if (formId) {
    revalidatePath(`/apps/${appId}/forms/${formId}`);
    revalidatePath(`/apps/${appId}/forms/${formId}/builder`);
  }
}

export async function listFormsAction(
  appId: string,
  query?: ListFormsQuery,
): Promise<ActionResult<{ items: GabForm[]; total: number }>> {
  try {
    return { success: true, data: await gabFormRepo.listForms(appId, query) };
  } catch (err) {
    return fail('listFormsAction', err);
  }
}

export async function getFormAction(appId: string, formId: string): Promise<ActionResult<GabForm>> {
  try {
    return { success: true, data: await gabFormRepo.getForm(appId, formId) };
  } catch (err) {
    return fail('getFormAction', err);
  }
}

export async function createFormAction(
  appId: string,
  payload: CreateFormPayload,
): Promise<ActionResult<GabForm>> {
  try {
    const data = await gabFormRepo.createForm(appId, payload);
    revalidateFormPaths(appId, data.id);
    return { success: true, data };
  } catch (err) {
    return fail('createFormAction', err);
  }
}

export async function updateFormAction(
  appId: string,
  formId: string,
  patch: UpdateFormPayload,
): Promise<ActionResult<GabForm>> {
  try {
    const data = await gabFormRepo.updateForm(appId, formId, patch);
    revalidateFormPaths(appId, formId);
    return { success: true, data };
  } catch (err) {
    return fail('updateFormAction', err);
  }
}

export async function deleteFormAction(
  appId: string,
  formId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabFormRepo.deleteForm(appId, formId);
    revalidateFormPaths(appId, formId);
    return { success: true, data };
  } catch (err) {
    return fail('deleteFormAction', err);
  }
}

export async function setDefaultFormAction(
  appId: string,
  formId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabFormRepo.setDefaultForm(appId, formId);
    revalidateFormPaths(appId, formId);
    return { success: true, data };
  } catch (err) {
    return fail('setDefaultFormAction', err);
  }
}

export async function getDefaultFormAction(
  appId: string,
  tableId: string,
): Promise<ActionResult<GabForm>> {
  try {
    return { success: true, data: await gabFormRepo.getDefaultForm(appId, tableId) };
  } catch (err) {
    return fail('getDefaultFormAction', err);
  }
}
