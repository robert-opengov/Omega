/**
 * Builds the `srcDoc` for the custom-component iframe sandbox.
 *
 * The runtime is intentionally tiny:
 *   - React 18 + ReactDOM (UMD from a pinned CDN)
 *   - A `gab` SDK object that postMessages requests back to the host
 *   - An `OMEGA_UI` scope with HTML-only primitives (buttons, cards, text)
 *     authored in plain JSX. We DO NOT ship MUI or Omega's React components
 *     into the iframe; user code stays small and Omega-themed via inherited
 *     CSS variables passed in from the host.
 *
 * User code is expected to default-export a function component. The host
 * page mounts it via React.createElement and forwards page props + a
 * `dataBinding` object so the component can read records via `gab.getRecords`.
 */

import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { buildIframeRuntimeScript } from './build-script';

export interface BuildSandboxOptions {
  code: string;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
  componentKey: string;
  /**
   * Whether `services.pageSdkExtended` is currently enabled. When false
   * the runtime omits the extended SDK methods + form-widget channel,
   * matching the server-side flag check exactly.
   */
  extendedSdk?: boolean;
}

const REACT_VERSION = '18.3.1';

/**
 * Prevents user code from breaking out of its `<script>` tag. Replaces the
 * literal sequence `</script>` (case-insensitive) with `<\/script>` so the
 * outer script tag stays intact while the JS payload remains valid.
 */
function safeForScriptTag(s: string): string {
  return s.replace(/<\/script/gi, '<\\/script');
}

/**
 * Inline runtime — kept short so the iframe boots fast.
 *
 * Body is built by `lib/page-builder/build-script.ts` so the
 * extended-SDK methods can be feature-flag-stripped out of the
 * generated source. Runtime always exposes:
 *   - React, ReactDOM
 *   - h: React.createElement shorthand
 *   - gab: SDK object with `getTables`, `getRecords`, etc., each returning
 *     a Promise that postMessages a `gab-request` and resolves on the
 *     matching `gab-response`. 30s timeout.
 *   - OMEGA_UI: minimal styled primitives matching Omega's tokens.
 *
 * It also wires `console.error`, `window.onerror`, and `unhandledrejection`
 * to a `gab:error` postMessage and ResizeObserver-driven `gab:resize`.
 *
 * Kept exported only for tests; the real entry point is `buildSandboxSrcDoc`.
 */
export function buildRuntimeScript(extendedSdk: boolean): string {
  return buildIframeRuntimeScript({ extended: extendedSdk });
}

/**
 * Wraps user code so it can use ESM `export default Foo` or named React
 * components. Supports JSX-free code only (we don't ship a transpiler).
 */
function buildMountScript(code: string): string {
  // Wrap in an IIFE that captures `module.exports` / `exports.default` /
  // a global default. User code that uses JSX should be pre-compiled by
  // the editor's analyzer (Phase 11 — currently AST-only). For now we
  // require plain `function` components using `h(...)` from React.
  return `
  (function(){
    try{
      var module = { exports: {} };
      var exports = module.exports;
      ${code}
      var Component = module.exports.default || module.exports;
      if (typeof Component !== 'function') {
        throw new Error('Custom component must export a default function.');
      }
      var root = ReactDOM.createRoot(document.getElementById('root'));
      var props = window.__GAB_PROPS__ || {};
      root.render(React.createElement(Component, props));
    } catch(err) {
      var box = document.createElement('div');
      box.style.cssText = 'border:1px dashed #dc2626;background:#fee2e2;color:#991b1b;padding:8px;font:12px/1.4 system-ui;border-radius:6px';
      box.textContent = 'Custom component error: ' + (err && err.message ? err.message : String(err));
      document.body.appendChild(box);
      try{ parent.postMessage({ type: 'gab:error', message: err.message || String(err) }, '*'); }catch(e){}
    }
  })();
  `;
}

export function buildSandboxSrcDoc(opts: BuildSandboxOptions): string {
  const propsJson = JSON.stringify({
    ...(opts.props ?? {}),
    __dataBinding: opts.dataBinding ?? null,
    __componentKey: opts.componentKey,
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; color: inherit; font-family: system-ui, -apple-system, sans-serif; }
    body { padding: 8px; }
  </style>
  <script src="https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js" crossorigin></script>
</head>
<body>
  <div id="root"></div>
  <script>window.__GAB_PROPS__ = ${propsJson};</script>
  <script>${buildRuntimeScript(opts.extendedSdk ?? false)}</script>
  <script>${safeForScriptTag(buildMountScript(opts.code))}</script>
</body>
</html>`;
}
