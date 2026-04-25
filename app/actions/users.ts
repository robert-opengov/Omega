'use server';

import { revalidatePath } from 'next/cache';
import { gabUserRepo } from '@/lib/core';
import type {
  GabUser,
  ListUsersQuery,
  ListUsersResult,
  UpdateUserParams,
} from '@/lib/core/ports/user.repository';

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

export async function listUsersAction(
  query?: ListUsersQuery,
): Promise<ActionResult<ListUsersResult>> {
  try {
    return { success: true, data: await gabUserRepo.listUsers(query) };
  } catch (err) {
    return fail('listUsersAction', err);
  }
}

export async function getUserAction(
  userId: string,
): Promise<ActionResult<GabUser>> {
  try {
    return { success: true, data: await gabUserRepo.getUser(userId) };
  } catch (err) {
    return fail('getUserAction', err);
  }
}

export async function updateUserAction(
  userId: string,
  patch: UpdateUserParams,
): Promise<ActionResult<GabUser>> {
  try {
    const data = await gabUserRepo.updateUser(userId, patch);
    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);
    return { success: true, data };
  } catch (err) {
    return fail('updateUserAction', err);
  }
}
