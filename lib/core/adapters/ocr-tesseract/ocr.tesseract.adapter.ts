import 'server-only';
import type {
  IOCRPort,
  OCRJobHandle,
  OCRJobStatus,
  OCRResult,
} from '../../ports/ocr.port';
import { OCRServiceError } from '../../ports/ocr.port';

/**
 * Tesseract OCR adapter — talks to the standalone OCR microservice.
 *
 * Exposes the job lifecycle as three separate operations so callers can
 * decide their own polling cadence:
 *   - startJob:     POST /ocr/jobs  +  PUT to presigned URL (returns handle)
 *   - getJobStatus: GET  /ocr/jobs/:id/status
 *   - getJobResult: GET  /ocr/jobs/:id/result
 */
export class OCRTesseractAdapter implements IOCRPort {
  constructor(private readonly baseUrl: string) {}

  async startJob(
    file: Uint8Array,
    fileName: string,
  ): Promise<OCRJobHandle> {
    this.assertConfigured();
    const { jobId, uploadUrl } = await this.createJob(fileName);
    await this.uploadFile(uploadUrl, file);
    return { jobId, fileName };
  }

  async getJobStatus(jobId: string): Promise<OCRJobStatus> {
    this.assertConfigured();
    const res = await fetch(
      `${this.baseUrl}/ocr/jobs/${encodeURIComponent(jobId)}/status`,
      { cache: 'no-store' },
    );
    await this.assertOk(res, 'getJobStatus');
    const data = await res.json();

    switch (data.status) {
      case 'PENDING':
      case 'PROCESSING':
      case 'COMPLETED':
        return { status: data.status };
      case 'FAILED':
        return {
          status: 'FAILED',
          error: data.error ?? `OCR job ${jobId} failed.`,
        };
      default:
        throw new OCRServiceError(
          `Unknown OCR job status: ${data.status}`,
        );
    }
  }

  async getJobResult(jobId: string): Promise<OCRResult> {
    this.assertConfigured();
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
  /*  Internal                                                           */
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

  private assertConfigured(): void {
    if (!this.baseUrl) {
      throw new OCRServiceError(
        'OCR service not configured: OCR_SERVICE_URL is missing.',
      );
    }
  }

  private async assertOk(res: Response, op: string): Promise<void> {
    if (res.ok) return;

    const detail = await res.text().catch(() => '');
    throw new OCRServiceError(
      `OCR service ${op} failed (${res.status}): ${detail}`,
      res.status,
    );
  }
}
