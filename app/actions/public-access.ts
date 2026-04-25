'use server';

import { revalidatePath } from 'next/cache';
import { gabPublicAccessRepo } from '@/lib/core';
import type {
  PublicLink,
  PublicAccessToken,
  CreatePublicLinkPayload,
  CreatePublicAccessTokenPayload,
  UpdatePublicAccessTokenPayload,
} from '@/lib/core/ports/public-access.repository';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function fail<T>(label: string, err: unknown): ActionResult<T> {
  const message = err instanceof Error ? err.message : `Failed: ${label}`;
  console.error(`${label} error:`, message);
  return { success: false, error: message };
}

// -- Public links -----------------------------------------------------------

export async function listPublicLinksAction(
  appId: string,
): Promise<ActionResult<{ items: PublicLink[]; total: number }>> {
  try {
    return { success: true, data: await gabPublicAccessRepo.listLinks(appId) };
  } catch (err) {
    return fail('listPublicLinksAction', err);
  }
}

export async function createPublicLinkAction(
  appId: string,
  payload: CreatePublicLinkPayload,
): Promise<ActionResult<PublicLink>> {
  try {
    const data = await gabPublicAccessRepo.createLink(appId, payload);
    revalidatePath(`/apps/${appId}/settings/public-links`);
    return { success: true, data };
  } catch (err) {
    return fail('createPublicLinkAction', err);
  }
}

export async function deletePublicLinkAction(
  appId: string,
  linkId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabPublicAccessRepo.deleteLink(appId, linkId);
    revalidatePath(`/apps/${appId}/settings/public-links`);
    return { success: true, data };
  } catch (err) {
    return fail('deletePublicLinkAction', err);
  }
}

// -- Public access tokens ---------------------------------------------------

export async function listPublicAccessTokensAction(
  appId: string,
): Promise<ActionResult<{ tokens: PublicAccessToken[] }>> {
  try {
    return { success: true, data: await gabPublicAccessRepo.listTokens(appId) };
  } catch (err) {
    return fail('listPublicAccessTokensAction', err);
  }
}

export async function createPublicAccessTokenAction(
  appId: string,
  payload: CreatePublicAccessTokenPayload,
): Promise<ActionResult<PublicAccessToken>> {
  try {
    const data = await gabPublicAccessRepo.createToken(appId, payload);
    revalidatePath(`/apps/${appId}/settings/access-tokens`);
    return { success: true, data };
  } catch (err) {
    return fail('createPublicAccessTokenAction', err);
  }
}

export async function updatePublicAccessTokenAction(
  appId: string,
  tokenId: string,
  payload: UpdatePublicAccessTokenPayload,
): Promise<ActionResult<PublicAccessToken>> {
  try {
    const data = await gabPublicAccessRepo.updateToken(appId, tokenId, payload);
    revalidatePath(`/apps/${appId}/settings/access-tokens`);
    return { success: true, data };
  } catch (err) {
    return fail('updatePublicAccessTokenAction', err);
  }
}

export async function deletePublicAccessTokenAction(
  appId: string,
  tokenId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const data = await gabPublicAccessRepo.deleteToken(appId, tokenId);
    revalidatePath(`/apps/${appId}/settings/access-tokens`);
    return { success: true, data };
  } catch (err) {
    return fail('deletePublicAccessTokenAction', err);
  }
}
