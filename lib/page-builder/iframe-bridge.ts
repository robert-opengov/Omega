/**
 * postMessage contract between the host page and a sandboxed custom-component
 * iframe.
 *
 * Two channels:
 *
 *   1. Status events (iframe → host)
 *      `gab:ready`, `gab:error`, `gab:resize`
 *
 *   2. SDK requests (iframe → host) and responses (host → iframe)
 *      `gab-request` { id, method, params } → relayed to a server action,
 *      then `gab-response` { id, ok, data?, error? } posted back to the iframe.
 *
 * The contract is intentionally narrow — only allow-listed read/write methods
 * are accepted. Cross-iframe origin is `*` because we use `srcDoc` (origin is
 * the parent itself), but the runtime ignores any non-matching message id.
 */

import { useEffect, type RefObject } from 'react';
import { pageSdkInvokeAction, type SdkMethod } from '@/app/actions/page-sdk';

// ─────────────────────────────────────────────────────────────────────
// Status events

export type CustomIframeStatus =
  | { type: 'gab:ready' }
  | { type: 'gab:error'; message: string }
  | { type: 'gab:resize'; height: number };

export function isCustomIframeMessage(data: unknown): data is CustomIframeStatus {
  if (!data || typeof data !== 'object') return false;
  const t = (data as { type?: string }).type;
  return typeof t === 'string' && t.startsWith('gab:');
}

// ─────────────────────────────────────────────────────────────────────
// SDK envelope

export interface SdkRequestEnvelope {
  type: 'gab-request';
  id: string;
  method: SdkMethod;
  params?: Record<string, unknown>;
}

export interface SdkResponseEnvelope {
  type: 'gab-response';
  id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

function isSdkRequest(data: unknown): data is SdkRequestEnvelope {
  if (!data || typeof data !== 'object') return false;
  const o = data as Partial<SdkRequestEnvelope>;
  return o.type === 'gab-request' && typeof o.id === 'string' && typeof o.method === 'string';
}

// ─────────────────────────────────────────────────────────────────────
// Host hook — wires status + SDK relay for one iframe

export interface UseIframeSdkBridgeOptions {
  appId: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onResize?: (height: number) => void;
  onError?: (message: string) => void;
  onReady?: () => void;
}

/**
 * Mounts a window-level message listener for one iframe. SDK requests are
 * dispatched to the server (`pageSdkInvokeAction`); status events fan out
 * to the supplied callbacks. Returns nothing; cleanup is automatic.
 */
export function useIframeSdkBridge({
  appId,
  iframeRef,
  onResize,
  onError,
  onReady,
}: UseIframeSdkBridgeOptions): void {
  useEffect(() => {
    function handler(ev: MessageEvent) {
      const target = iframeRef.current?.contentWindow;
      if (target && ev.source !== target) return;

      const data = ev.data;
      if (isCustomIframeMessage(data)) {
        if (data.type === 'gab:ready') onReady?.();
        if (data.type === 'gab:resize') onResize?.(data.height);
        if (data.type === 'gab:error') onError?.(data.message);
        return;
      }
      if (!isSdkRequest(data)) return;

      pageSdkInvokeAction(appId, {
        method: data.method,
        params: data.params ?? {},
      }).then((res) => {
        const response: SdkResponseEnvelope = res.ok
          ? { type: 'gab-response', id: data.id, ok: true, data: res.data }
          : { type: 'gab-response', id: data.id, ok: false, error: res.error };
        try {
          iframeRef.current?.contentWindow?.postMessage(response, '*');
        } catch {
          /* iframe gone */
        }
      });
    }

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [appId, iframeRef, onReady, onResize, onError]);
}

// ─────────────────────────────────────────────────────────────────────
// Re-exports kept for callers that imported the older type name

export const CUSTOM_IFRAME_ORIGIN = '*';
export type CustomIframeMessage = CustomIframeStatus;
