'use server';

import { revalidatePath } from 'next/cache';
import { gabRelationshipRepo } from '@/lib/core';
import type {
  GabRelationship,
  CreateRelationshipPayload,
  UpdateRelationshipPayload,
} from '@/lib/core/ports/relationship.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail<T>(label: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed: ${label}`;
  console.error(`${label} error:`, message);
  return { success: false, error: message };
}

export async function listRelationshipsAction(
  appId: string,
  tableId?: string,
): Promise<ActionResult<{ items: GabRelationship[]; total: number }>> {
  try {
    return {
      success: true,
      data: await gabRelationshipRepo.listRelationships(appId, tableId),
    };
  } catch (err) {
    return fail('listRelationshipsAction', err);
  }
}

export async function createRelationshipAction(
  appId: string,
  payload: CreateRelationshipPayload,
): Promise<ActionResult<GabRelationship>> {
  try {
    const data = await gabRelationshipRepo.createRelationship(appId, payload);
    revalidatePath(`/apps/${appId}/relationships`);
    return { success: true, data };
  } catch (err) {
    return fail('createRelationshipAction', err);
  }
}

export async function updateRelationshipAction(
  appId: string,
  relationshipId: string,
  payload: UpdateRelationshipPayload,
): Promise<ActionResult<GabRelationship>> {
  try {
    const data = await gabRelationshipRepo.updateRelationship(
      appId,
      relationshipId,
      payload,
    );
    revalidatePath(`/apps/${appId}/relationships`);
    return { success: true, data };
  } catch (err) {
    return fail('updateRelationshipAction', err);
  }
}

export async function deleteRelationshipAction(
  appId: string,
  relationshipId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabRelationshipRepo.deleteRelationship(
      appId,
      relationshipId,
    );
    revalidatePath(`/apps/${appId}/relationships`);
    return { success: true, data };
  } catch (err) {
    return fail('deleteRelationshipAction', err);
  }
}
