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
 *   3. Form-widget channel (iframe ↔ host) — only active when
 *      `services.pageSdkExtended` is on. Lets a custom component embedded
 *      inside a Form widget read live form values and push edits back.
 *      `gab-form-values` (host → iframe), `gab-form-set-field`
 *      (iframe → host).
 *
 * The contract is intentionally narrow — only allow-listed read/write methods
 * are accepted. Cross-iframe origin is `*` because we use `srcDoc` (origin is
 * the parent itself), but the runtime ignores any non-matching message id.
 *
 * Parent-side cache: `getTables` and `getFields` are read-mostly and lookup
 * the same data across many iframes on a page. We memoize per appId for the
 * lifetime of a single page render so repeated lookups don't N+1 the BFF.
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { pageSdkInvokeAction, type SdkMethod } from '@/app/actions/page-sdk';
import { useModuleEnabled } from '@/providers/module-flags-provider';

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
// Form-widget channel

interface FormSetFieldMessage {
  type: 'gab-form-set-field';
  field: string;
  value: unknown;
}

function isFormSetFieldMessage(data: unknown): data is FormSetFieldMessage {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return d.type === 'gab-form-set-field' && typeof d.field === 'string';
}

export interface FormWidgetContext {
  values: Record<string, unknown>;
  fields: Array<{ name: string; type: string; key: string }>;
  readOnly?: boolean;
  onChange?: (fieldName: string, value: unknown) => void;
}

// ─────────────────────────────────────────────────────────────────────
// Parent-side response cache (getTables / getFields)

interface CacheEntry {
  expires: number;
  value: unknown;
}

const PARENT_CACHE = new Map<string, CacheEntry>();
const PARENT_CACHE_TTL_MS = 30_000;
const CACHEABLE_METHODS: ReadonlySet<SdkMethod> = new Set<SdkMethod>(['getTables', 'getFields']);

function cacheKey(appId: string, method: SdkMethod, params: Record<string, unknown>): string {
  if (method === 'getTables') return `${appId}:getTables`;
  if (method === 'getFields') {
    return `${appId}:getFields:${String(params.tableKey ?? '')}`;
  }
  return `${appId}:${method}:${JSON.stringify(params)}`;
}

function readCache(key: string): unknown | undefined {
  const entry = PARENT_CACHE.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    PARENT_CACHE.delete(key);
    return undefined;
  }
  return entry.value;
}

function writeCache(key: string, value: unknown) {
  PARENT_CACHE.set(key, { expires: Date.now() + PARENT_CACHE_TTL_MS, value });
}

export function clearPageSdkCache() {
  PARENT_CACHE.clear();
}

// ─────────────────────────────────────────────────────────────────────
// Host hook — wires status + SDK relay for one iframe

export interface UseIframeSdkBridgeOptions {
  appId: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onResize?: (height: number) => void;
  onError?: (message: string) => void;
  onReady?: () => void;
  /**
   * When provided, the bridge participates in the form-widget channel:
   * pushes `gab-form-values` whenever values change and forwards
   * `gab-form-set-field` events into `formContext.onChange`. Only honored
   * when `services.pageSdkExtended` is enabled.
   */
  formContext?: FormWidgetContext;
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
  formContext,
}: UseIframeSdkBridgeOptions): void {
  const extendedEnabled = useModuleEnabled('services.pageSdkExtended');
  const formContextRef = useRef(formContext);
  formContextRef.current = formContext;
  const extendedRef = useRef(extendedEnabled);
  extendedRef.current = extendedEnabled;

  // Memoize the values payload so `useEffect` only re-fires when actual
  // form data changes, not on every parent re-render.
  const formPayload = useMemo(() => {
    if (!formContext || !extendedEnabled) return null;
    return {
      type: 'gab-form-values' as const,
      values: formContext.values,
      fields: formContext.fields,
      readOnly: formContext.readOnly ?? false,
    };
  }, [formContext, extendedEnabled]);

  // Push form values into the iframe whenever they change.
  useEffect(() => {
    if (!formPayload) return;
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    try {
      target.postMessage(formPayload, '*');
    } catch {
      /* iframe gone */
    }
  }, [formPayload, iframeRef]);

  useEffect(() => {
    function handler(ev: MessageEvent) {
      const target = iframeRef.current?.contentWindow;
      if (target && ev.source !== target) return;

      const data = ev.data;
      if (isCustomIframeMessage(data)) {
        if (data.type === 'gab:ready') {
          onReady?.();
          // After ready, re-push form values so the iframe can hydrate.
          if (formPayload) {
            try {
              target?.postMessage(formPayload, '*');
            } catch {
              /* noop */
            }
          }
        }
        if (data.type === 'gab:resize') onResize?.(data.height);
        if (data.type === 'gab:error') onError?.(data.message);
        return;
      }

      if (isFormSetFieldMessage(data)) {
        if (extendedRef.current && formContextRef.current?.onChange) {
          formContextRef.current.onChange(data.field, data.value);
        }
        return;
      }

      if (!isSdkRequest(data)) return;

      const params = data.params ?? {};
      const method = data.method;

      // Parent cache fast-path for read-mostly methods.
      if (CACHEABLE_METHODS.has(method)) {
        const ck = cacheKey(appId, method, params);
        const cached = readCache(ck);
        if (cached !== undefined) {
          try {
            target?.postMessage(
              { type: 'gab-response', id: data.id, ok: true, data: cached },
              '*',
            );
          } catch {
            /* noop */
          }
          return;
        }
      }

      pageSdkInvokeAction(appId, { method, params }).then((res) => {
        const response: SdkResponseEnvelope = res.ok
          ? { type: 'gab-response', id: data.id, ok: true, data: res.data }
          : { type: 'gab-response', id: data.id, ok: false, error: res.error };
        if (res.ok && CACHEABLE_METHODS.has(method)) {
          writeCache(cacheKey(appId, method, params), res.data);
        }
        try {
          iframeRef.current?.contentWindow?.postMessage(response, '*');
        } catch {
          /* iframe gone */
        }
      });
    }

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [appId, iframeRef, onReady, onResize, onError, formPayload]);
}

// ─────────────────────────────────────────────────────────────────────
// Re-exports kept for callers that imported the older type name

export const CUSTOM_IFRAME_ORIGIN = '*';
export type CustomIframeMessage = CustomIframeStatus;
