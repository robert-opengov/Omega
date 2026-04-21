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
  /** Extract text from a PDF file. Returns structured OCR results. */
  extractText(file: Uint8Array, fileName: string): Promise<OCRResult>;
}
