'use server';

import { z } from 'zod';
import { gabUserMetadataRepo } from '@/lib/core';
import { assertModuleEnabled, FeatureDisabledError } from '@/lib/feature-guards';
import type { UserMetadata } from '@/lib/core/ports/user-metadata.repository';

const schema = z.object({
  appId: z.string().min(1),
  userId: z.string().min(1),
});

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Read-side companion to the patch action. Lives next to the admin
 * client component because it's only consumed there — co-locating keeps
 * the admin surface self-contained and easy to delete with the feature.
 */
export async function getUserMetadataAction(
  raw: z.input<typeof schema>,
): Promise<ActionResult<UserMetadata>> {
  try {
    await assertModuleEnabled('platform.userMetadata');
    const { appId, userId } = schema.parse(raw);
    const data = await gabUserMetadataRepo.getUserMetadata(appId, userId);
    return { success: true, data };
  } catch (err) {
    if (err instanceof FeatureDisabledError) {
      return { success: false, error: err.message };
    }
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((i) => i.message).join('; ') };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
