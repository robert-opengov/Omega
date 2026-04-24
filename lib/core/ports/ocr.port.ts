/* ------------------------------------------------------------------ */
/*  Domain types — OCR results                                         */
/* ------------------------------------------------------------------ */

export interface OCRPage {
  pageNumber: number;
  text: string;
  confidence: number;
}

export interface OCRResult {
  pageCount: number;
  pages: OCRPage[];
  fullText: string;
}

/* ------------------------------------------------------------------ */
/*  Job lifecycle types                                                */
/* ------------------------------------------------------------------ */

export interface OCRJobHandle {
  jobId: string;
  fileName: string;
  /**
   * Best-effort estimate of how long OCR will take, in milliseconds.
   * Adapters derive this from page count and their own throughput profile.
   */
  estimatedTimeMs: number;
}

export type OCRJobStatus =
  | { status: 'PENDING' }
  | { status: 'PROCESSING' }
  | { status: 'COMPLETED' }
  | { status: 'FAILED'; error: string };

/* ------------------------------------------------------------------ */
/*  Typed errors                                                       */
/* ------------------------------------------------------------------ */

export class OCRServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'OCRServiceError';
  }
}

/* ------------------------------------------------------------------ */
/*  Port interface                                                     */
/* ------------------------------------------------------------------ */

export interface IOCRPort {
  /**
   * Create an OCR job and upload the file. Returns as soon as the upload
   * completes — extraction runs asynchronously on the OCR service.
   */
  startJob(file: Uint8Array, fileName: string): Promise<OCRJobHandle>;

  /** Fetch the current status of a job. One poll tick. */
  getJobStatus(jobId: string): Promise<OCRJobStatus>;

  /** Fetch the result. Only valid after status is COMPLETED. */
  getJobResult(jobId: string): Promise<OCRResult>;
}
