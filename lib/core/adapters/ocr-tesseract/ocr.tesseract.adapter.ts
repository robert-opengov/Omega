import 'server-only';
import type { IOCRPort, OCRResult } from '../../ports/ocr.port';
import { OCRServiceError } from '../../ports/ocr.port';

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 100; // 5 minutes at 3s intervals

/**
 * Tesseract OCR adapter — talks to the standalone OCR microservice.
 *
 * Internally manages the full async job lifecycle:
 *   1. POST /ocr/jobs            → create job + get presigned upload URL
 *   2. PUT  to presigned URL     → upload PDF
 *   3. GET  /ocr/jobs/:id/status → poll until COMPLETED or FAILED
 *   4. GET  /ocr/jobs/:id/result → fetch extracted text
 *
 * Callers see a single `extractText()` call.
 */
export class OCRTesseractAdapter implements IOCRPort {
  constructor(private readonly baseUrl: string) {}

  /* ------------------------------------------------------------------ */
  /*  extractText — the only public method                               */
  /* ------------------------------------------------------------------ */

  async extractText(file: Uint8Array, fileName: string): Promise<OCRResult> {
    if (!this.baseUrl) {
      throw new OCRServiceError(
        'OCR service not configured: OCR_SERVICE_URL is missing.',
      );
    }
    const { jobId, uploadUrl } = await this.createJob(fileName);
    await this.uploadFile(uploadUrl, file);
    await this.pollUntilDone(jobId);
    return this.fetchResult(jobId);
  }

  /* ------------------------------------------------------------------ */
  /*  Internal: job lifecycle steps                                      */
  /* ------------------------------------------------------------------ */

  private async createJob(
    fileName: string,
  ): Promise<{ jobId: string; uploadUrl: string }> {
    const res = await fetch(`${this.baseUrl}/ocr/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName }),
      cache: 'no-store',
    });

    await this.assertOk(res, 'createJob');
    const data = await res.json();
    return { jobId: data.jobId, uploadUrl: data.uploadUrl };
  }

  private async uploadFile(
    uploadUrl: string,
    file: Uint8Array,
  ): Promise<void> {
    const blob = new Blob([file as BlobPart], { type: 'application/pdf' });
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: blob,
    });

    if (!res.ok) {
      throw new OCRServiceError(
        `File upload failed (${res.status}): ${res.statusText}`,
        res.status,
      );
    }
  }

  private async pollUntilDone(jobId: string): Promise<void> {
    const encodedId = encodeURIComponent(jobId);

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const res = await fetch(
        `${this.baseUrl}/ocr/jobs/${encodedId}/status`,
        { cache: 'no-store' },
      );
      await this.assertOk(res, 'getJobStatus');
      const data = await res.json();

      if (data.status === 'COMPLETED') return;

      if (data.status === 'FAILED') {
        throw new OCRServiceError(
          data.error || `OCR job ${jobId} failed.`,
        );
      }

      await sleep(POLL_INTERVAL_MS);
    }

    throw new OCRServiceError(
      `OCR job ${jobId} timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s.`,
    );
  }

  private async fetchResult(jobId: string): Promise<OCRResult> {
    const res = await fetch(
      `${this.baseUrl}/ocr/jobs/${encodeURIComponent(jobId)}/result`,
      { cache: 'no-store' },
    );
    await this.assertOk(res, 'getJobResult');

    const data = await res.json();
    return {
      pageCount: data.pageCount,
      pages: data.pages,
      fullText: data.fullText,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  private async assertOk(res: Response, op: string): Promise<void> {
    if (res.ok) return;

    const detail = await res.text().catch(() => '');
    throw new OCRServiceError(
      `OCR service ${op} failed (${res.status}): ${detail}`,
      res.status,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
