/**
 * postMessage contract between the host app and the sandboxed custom-component iframe.
 */

export const CUSTOM_IFRAME_ORIGIN = '*';

export type CustomIframeMessage =
  | { type: 'gab:ready' }
  | { type: 'gab:error'; message: string }
  | { type: 'gab:resize'; height: number };

export function isCustomIframeMessage(data: unknown): data is CustomIframeMessage {
  if (!data || typeof data !== 'object') return false;
  const t = (data as { type?: string }).type;
  return typeof t === 'string' && t.startsWith('gab:');
}
