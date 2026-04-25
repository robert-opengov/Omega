'use server';

import { revalidatePath } from 'next/cache';
import { gabFieldRepo } from '@/lib/core';
import type {
  GabField,
  CreateFieldPayload,
  UpdateFieldPayload,
  FieldTypeChangeValidation,
  FieldDependents,
} from '@/lib/core/ports/field.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail<T>(label: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed: ${label}`;
  console.error(`${label} error:`, message);
  return { success: false, error: message };
}

export async function listFieldsAction(
  appId: string,
  tableId: string,
  options?: { includeSystem?: boolean },
): Promise<ActionResult<{ items: GabField[]; total: number }>> {
  try {
    return { success: true, data: await gabFieldRepo.listFields(appId, tableId, options) };
  } catch (err) {
    return fail('listFieldsAction', err);
  }
}

export async function getFieldAction(
  appId: string,
  tableId: string,
  fieldId: string,
): Promise<ActionResult<GabField>> {
  try {
    return { success: true, data: await gabFieldRepo.getField(appId, tableId, fieldId) };
  } catch (err) {
    return fail('getFieldAction', err);
  }
}

export async function createFieldAction(
  appId: string,
  tableId: string,
  payload: CreateFieldPayload,
): Promise<ActionResult<GabField>> {
  try {
    const data = await gabFieldRepo.createField(appId, tableId, payload);
    revalidatePath(`/apps/${appId}/tables/${tableId}`);
    return { success: true, data };
  } catch (err) {
    return fail('createFieldAction', err);
  }
}

export async function updateFieldAction(
  appId: string,
  tableId: string,
  fieldId: string,
  payload: UpdateFieldPayload,
): Promise<ActionResult<GabField>> {
  try {
    const data = await gabFieldRepo.updateField(appId, tableId, fieldId, payload);
    revalidatePath(`/apps/${appId}/tables/${tableId}`);
    return { success: true, data };
  } catch (err) {
    return fail('updateFieldAction', err);
  }
}

export async function deleteFieldAction(
  appId: string,
  tableId: string,
  fieldId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabFieldRepo.deleteField(appId, tableId, fieldId);
    revalidatePath(`/apps/${appId}/tables/${tableId}`);
    return { success: true, data };
  } catch (err) {
    return fail('deleteFieldAction', err);
  }
}

export async function validateFieldTypeChangeAction(
  appId: string,
  tableId: string,
  fieldId: string,
  newType: string,
): Promise<ActionResult<FieldTypeChangeValidation>> {
  try {
    return {
      success: true,
      data: await gabFieldRepo.validateTypeChange(appId, tableId, fieldId, newType),
    };
  } catch (err) {
    return fail('validateFieldTypeChangeAction', err);
  }
}

export async function getFieldDependentsAction(
  appId: string,
  tableId: string,
  fieldId: string,
): Promise<ActionResult<FieldDependents>> {
  try {
    return {
      success: true,
      data: await gabFieldRepo.getFieldDependents(appId, tableId, fieldId),
    };
  } catch (err) {
    return fail('getFieldDependentsAction', err);
  }
}
