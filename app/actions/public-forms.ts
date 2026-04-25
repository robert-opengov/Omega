'use server';

import { gabPublicFormRepo } from '@/lib/core';
import type {
  PublicFormField,
  PublicFormSettings,
  PublicFormSubmitResult,
  PublicPageResolveResult,
  GabForm,
} from '@/lib/core/ports/form.repository';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PublicFormResolvedData {
  form: GabForm;
  fields: PublicFormField[];
  settings: PublicFormSettings;
}

function fail<T>(scope: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed to ${scope}.`;
  console.error(`${scope} error:`, message);
  return { success: false, error: message };
}

export async function resolvePublicFormAction(
  token: string,
): Promise<ActionResult<PublicFormResolvedData>> {
  try {
    const resolved = await gabPublicFormRepo.resolvePublicForm(token);
    return {
      success: true,
      data: {
        form: resolved.form,
        fields: resolved.fields,
        settings: resolved.settings,
      },
    };
  } catch (err) {
    return fail('resolvePublicFormAction', err);
  }
}

export async function resolvePublicPageAction(
  token: string,
): Promise<ActionResult<PublicPageResolveResult>> {
  try {
    const data = await gabPublicFormRepo.resolvePublicPage(token);
    return { success: true, data };
  } catch (err) {
    return fail('resolvePublicPageAction', err);
  }
}

export async function submitPublicFormAction(
  token: string,
  values: Record<string, unknown>,
): Promise<ActionResult<PublicFormSubmitResult>> {
  try {
    const resolved = await gabPublicFormRepo.resolvePublicForm(token);
    const data = await gabPublicFormRepo.submitPublicForm(
      token,
      resolved.bearerToken,
      values,
    );
    return { success: true, data };
  } catch (err) {
    return fail('submitPublicFormAction', err);
  }
}
