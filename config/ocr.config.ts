/**
 * OCR service configuration.
 *
 * Server-only values (baseUrl) are read from env vars.
 * Client-visible values (loading messages) are constants — forks
 * override them by editing this file directly.
 */

/** Server-only: never import this from client components. */
export const ocrConfig = {
  /** Base URL for the OCR service API (no trailing slash). */
  baseUrl: process.env.OCR_SERVICE_URL || '',
} as const;

/**
 * Client-safe: messages shown while OCR is processing.
 * Forks can replace these with domain-specific messages.
 */
export const ocrLoadingMessages: readonly string[] = [
  'Reading the fine print...',
  'Teaching robots to read...',
  'Decoding bureaucratic hieroglyphs...',
  'Converting coffee stains to text...',
  'Asking the document nicely...',
  'Squinting at pixels really hard...',
  'Translating from PDF to human...',
  'Running the OCR hamster wheel...',
  'Convincing the scanner we mean well...',
  'Extracting wisdom from dead trees...',
];

export type OCRConfig = typeof ocrConfig;
