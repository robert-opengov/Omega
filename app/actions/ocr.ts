'use server';

/**
 * OCR Server Actions — bridge between client components and the OCR port.
 *
 * The job lifecycle is split across three actions so clients can drive
 * their own polling cadence:
 *   - startOcrJobAction:     upload the file, return { jobId, fileName }
 *   - getOcrJobStatusAction: one poll tick
 *   - getOcrJobResultAction: fetch result once status is COMPLETED
 */

import { ocrPort } from '@/lib/core';
import type {
  OCRJobHandle,
  OCRJobStatus,
  OCRResult,
} from '@/lib/core/ports/ocr.port';

/* ------------------------------------------------------------------ */
/*  Result types                                                       */
/* ------------------------------------------------------------------ */

export type StartOcrJobActionResult =
  | { success: true; data: OCRJobHandle }
  | { success: false; error: string };

export type GetOcrJobStatusActionResult =
  | { success: true; data: OCRJobStatus }
  | { success: false; error: string };

export type GetOcrJobResultActionResult =
  | { success: true; data: OCRResult }
  | { success: false; error: string };

/* ------------------------------------------------------------------ */
/*  startOcrJobAction — POST /ocr/jobs + PUT presigned upload          */
/* ------------------------------------------------------------------ */

export async function startOcrJobAction(
  formData: FormData,
): Promise<StartOcrJobActionResult> {
  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      return { success: false, error: 'No file provided.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const handle = await ocrPort.startJob(bytes, file.name);
    return { success: true, data: handle };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start OCR job.';
    console.error('startOcrJobAction error:', message);
    return { success: false, error: message };
  }
}

/* ------------------------------------------------------------------ */
/*  getOcrJobStatusAction — one poll tick                              */
/* ------------------------------------------------------------------ */

export async function getOcrJobStatusAction(
  jobId: string,
): Promise<GetOcrJobStatusActionResult> {
  try {
    if (!jobId) {
      return { success: false, error: 'jobId is required.' };
    }
    const status = await ocrPort.getJobStatus(jobId);
    return { success: true, data: status };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch OCR status.';
    console.error('getOcrJobStatusAction error:', message);
    return { success: false, error: message };
  }
}

/* ------------------------------------------------------------------ */
/*  getOcrJobResultAction — fetch extracted text                       */
/* ------------------------------------------------------------------ */

export async function getOcrJobResultAction(
  jobId: string,
): Promise<GetOcrJobResultActionResult> {
  try {
    if (!jobId) {
      return { success: false, error: 'jobId is required.' };
    }
    const result = await ocrPort.getJobResult(jobId);
    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch OCR result.';
    console.error('getOcrJobResultAction error:', message);
    return { success: false, error: message };
  }
}
