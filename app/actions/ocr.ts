'use server';

/**
 * OCR Server Actions — bridge between client components and the OCR port.
 *
 * Accepts FormData with a PDF file, extracts bytes on the server,
 * and delegates to the port. The adapter handles the full lifecycle.
 */

import { ocrPort } from '@/lib/core';
import type { OCRResult } from '@/lib/core/ports/ocr.port';

/* ------------------------------------------------------------------ */
/*  Result type                                                        */
/* ------------------------------------------------------------------ */

export type ExtractTextActionResult =
  | { success: true; data: OCRResult }
  | { success: false; error: string };

/* ------------------------------------------------------------------ */
/*  extractTextAction                                                  */
/* ------------------------------------------------------------------ */

export async function extractTextAction(
  formData: FormData,
): Promise<ExtractTextActionResult> {
  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      return { success: false, error: 'No file provided.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const result = await ocrPort.extractText(bytes, file.name);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR processing failed.';
    console.error('extractTextAction error:', message);
    return { success: false, error: message };
  }
}
