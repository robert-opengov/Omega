'use server';

import { gabDocumentRepo } from '@/lib/core';
import type {
  CreateDocumentsRequest,
  CreateDocumentsResult,
  DownloadUrlResult,
  DocumentMetadata,
  BulkDownloadItem,
} from '@/lib/core/ports/documents.repository';

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

export async function createDocumentsAction(
  appId: string,
  request: CreateDocumentsRequest,
): Promise<ActionResult<CreateDocumentsResult>> {
  try {
    return { success: true, data: await gabDocumentRepo.createDocuments(appId, request) };
  } catch (err) {
    return fail('createDocumentsAction', err);
  }
}

export async function getDocumentDownloadUrlAction(
  appId: string,
  docId: string,
  fileName?: string,
): Promise<ActionResult<DownloadUrlResult>> {
  try {
    return {
      success: true,
      data: await gabDocumentRepo.getDownloadUrl(appId, docId, fileName),
    };
  } catch (err) {
    return fail('getDocumentDownloadUrlAction', err);
  }
}

export async function getDocumentMetadataAction(
  appId: string,
  docId: string,
): Promise<ActionResult<DocumentMetadata>> {
  try {
    return { success: true, data: await gabDocumentRepo.getDocument(appId, docId) };
  } catch (err) {
    return fail('getDocumentMetadataAction', err);
  }
}

export async function bulkDocumentDownloadUrlsAction(
  appId: string,
  docIds: string[],
): Promise<ActionResult<BulkDownloadItem[]>> {
  try {
    return { success: true, data: await gabDocumentRepo.bulkDownloadUrls(appId, docIds) };
  } catch (err) {
    return fail('bulkDocumentDownloadUrlsAction', err);
  }
}
