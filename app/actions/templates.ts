'use server';

import { revalidatePath } from 'next/cache';
import { gabTemplateRepo } from '@/lib/core';
import type {
  ApplyTemplateUpdatePayload,
  GabAppSubscription,
  GabTemplate,
  GabTemplateVersion,
  MaterializeTemplatePayload,
  TemplateSubscriber,
  ThreeWayDiff,
} from '@/lib/core/ports/template.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail(prefix: string, err: unknown): ActionResult<never> {
  const message = err instanceof Error ? err.message : prefix;
  console.error(prefix, message);
  return { success: false, error: message };
}

export async function listTemplatesAction(): Promise<
  ActionResult<{ items: GabTemplate[]; total: number }>
> {
  try {
    return { success: true, data: await gabTemplateRepo.listTemplates() };
  } catch (err) {
    return fail('listTemplatesAction error:', err);
  }
}

export async function getTemplateAction(
  templateId: string,
): Promise<ActionResult<GabTemplate>> {
  try {
    return { success: true, data: await gabTemplateRepo.getTemplate(templateId) };
  } catch (err) {
    return fail('getTemplateAction error:', err);
  }
}

export async function deleteTemplateAction(
  templateId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabTemplateRepo.deleteTemplate(templateId);
    revalidatePath('/templates');
    return { success: true, data };
  } catch (err) {
    return fail('deleteTemplateAction error:', err);
  }
}

export async function materializeTemplateAction(
  templateId: string,
  payload: MaterializeTemplatePayload,
): Promise<ActionResult<{ id: string; key: string; name: string }>> {
  try {
    const data = await gabTemplateRepo.materialize(templateId, payload);
    revalidatePath('/apps');
    revalidatePath('/templates');
    return { success: true, data };
  } catch (err) {
    return fail('materializeTemplateAction error:', err);
  }
}

export async function publishTemplateAction(
  templateId: string,
  payload: { changelog?: string },
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabTemplateRepo.publish(templateId, payload);
    revalidatePath(`/templates/${templateId}`);
    return { success: true, data };
  } catch (err) {
    return fail('publishTemplateAction error:', err);
  }
}

export async function listTemplateVersionsAction(
  templateId: string,
): Promise<ActionResult<{ items: GabTemplateVersion[]; total: number }>> {
  try {
    return { success: true, data: await gabTemplateRepo.listVersions(templateId) };
  } catch (err) {
    return fail('listTemplateVersionsAction error:', err);
  }
}

export async function listTemplateSubscribersAction(
  templateId: string,
): Promise<ActionResult<{ items: TemplateSubscriber[]; total: number }>> {
  try {
    return { success: true, data: await gabTemplateRepo.listSubscribers(templateId) };
  } catch (err) {
    return fail('listTemplateSubscribersAction error:', err);
  }
}

export async function getTemplateDiffAction(
  appId: string,
): Promise<ActionResult<ThreeWayDiff>> {
  try {
    return { success: true, data: await gabTemplateRepo.getTemplateDiff(appId) };
  } catch (err) {
    return fail('getTemplateDiffAction error:', err);
  }
}

export async function applyTemplateUpdateAction(
  appId: string,
  payload: ApplyTemplateUpdatePayload,
): Promise<ActionResult<GabAppSubscription>> {
  try {
    const data = await gabTemplateRepo.applyTemplateUpdate(appId, payload);
    revalidatePath(`/apps/${appId}`);
    return { success: true, data };
  } catch (err) {
    return fail('applyTemplateUpdateAction error:', err);
  }
}

export async function rollbackTemplateAction(
  appId: string,
  targetVersion: number,
): Promise<ActionResult<GabAppSubscription>> {
  try {
    const data = await gabTemplateRepo.rollbackTemplate(appId, targetVersion);
    revalidatePath(`/apps/${appId}`);
    return { success: true, data };
  } catch (err) {
    return fail('rollbackTemplateAction error:', err);
  }
}

export async function getAppSubscriptionAction(
  appId: string,
): Promise<ActionResult<GabAppSubscription | null>> {
  try {
    return { success: true, data: await gabTemplateRepo.getAppSubscription(appId) };
  } catch (err) {
    return fail('getAppSubscriptionAction error:', err);
  }
}

export async function extractTemplateFromAppAction(
  appId: string,
  payload: { templateName?: string },
): Promise<ActionResult<GabTemplate>> {
  try {
    const data = await gabTemplateRepo.extractFromApp(appId, payload);
    revalidatePath('/templates');
    return { success: true, data };
  } catch (err) {
    return fail('extractTemplateFromAppAction error:', err);
  }
}
