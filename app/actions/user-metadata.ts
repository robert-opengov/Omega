'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { gabUserMetadataRepo } from '@/lib/core';
import { assertModuleEnabled, FeatureDisabledError } from '@/lib/feature-guards';
import type {
  CreateMetadataFieldPayload,
  MetadataField,
  UserMetadata,
} from '@/lib/core/ports/user-metadata.repository';

const fieldTypeSchema = z.enum(['text', 'number', 'select', 'boolean', 'date']);

const createFieldSchema = z.object({
  appId: z.string().min(1),
  fieldName: z.string().min(1),
  fieldType: fieldTypeSchema,
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

const deleteFieldSchema = z.object({
  appId: z.string().min(1),
  fieldId: z.string().min(1),
});

const patchMetaSchema = z.object({
  appId: z.string().min(1),
  userId: z.string().min(1),
  metadata: z.record(z.unknown()),
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

export async function createMetadataFieldAction(
  raw: z.input<typeof createFieldSchema>,
): Promise<ActionResult<MetadataField>> {
  try {
    await assertModuleEnabled('platform.userMetadata');
    const { appId, ...payload } = createFieldSchema.parse(raw);
    const created = await gabUserMetadataRepo.createField(
      appId,
      payload as CreateMetadataFieldPayload,
    );
    revalidatePath('/users/metadata');
    return { success: true, data: created };
  } catch (err) {
    return mapError(err);
  }
}

export async function deleteMetadataFieldAction(
  raw: z.input<typeof deleteFieldSchema>,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await assertModuleEnabled('platform.userMetadata');
    const { appId, fieldId } = deleteFieldSchema.parse(raw);
    const result = await gabUserMetadataRepo.deleteField(appId, fieldId);
    revalidatePath('/users/metadata');
    return { success: true, data: result };
  } catch (err) {
    return mapError(err);
  }
}

export async function patchUserMetadataAction(
  raw: z.input<typeof patchMetaSchema>,
): Promise<ActionResult<UserMetadata>> {
  try {
    await assertModuleEnabled('platform.userMetadata');
    const { appId, userId, metadata } = patchMetaSchema.parse(raw);
    const result = await gabUserMetadataRepo.patchUserMetadata(
      appId,
      userId,
      metadata,
    );
    revalidatePath('/users/metadata');
    return { success: true, data: result };
  } catch (err) {
    return mapError(err);
  }
}
