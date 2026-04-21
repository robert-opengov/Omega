'use server';

import { gabSchemaRepo } from '@/lib/core';
import type { GabField } from '@/lib/core/ports/schema.repository';

export async function listFieldsAction(
  applicationKey: string,
  applicationTableKey: string,
): Promise<{ success: boolean; data?: { items: GabField[]; total: number }; error?: string }> {
  try {
    const result = await gabSchemaRepo.listFields(applicationKey, applicationTableKey);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list fields.';
    console.error('listFieldsAction error:', message);
    return { success: false, error: message };
  }
}
