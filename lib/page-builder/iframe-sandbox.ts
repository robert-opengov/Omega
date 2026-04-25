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

export interface BuildSandboxOptions {
  code: string;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
  componentKey: string;
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
 * The runtime exposes (on `window`):
 *   - React, ReactDOM
 *   - h: React.createElement shorthand
 *   - gab: SDK object with `getTables`, `getRecords`, etc., each returning
 *     a Promise that postMessages a `gab-request` and resolves on the
 *     matching `gab-response`. 30s timeout.
 *   - OMEGA_UI: minimal styled primitives matching Omega's tokens
 *     (Button, Card, Heading, Text, Input).
 *
 * It also wires `console.error`, `window.onerror`, and `unhandledrejection`
 * to a `gab:error` postMessage and ResizeObserver-driven `gab:resize`.
 */
function buildRuntimeScript(): string {
  return `
  (function(){
    var pending = {};
    var nextId = 1;

    function post(msg){ try{ parent.postMessage(msg, '*'); }catch(e){} }
    function call(method, params){
      return new Promise(function(resolve, reject){
        var id = String(nextId++);
        pending[id] = { resolve: resolve, reject: reject, t: Date.now() };
        post({ type: 'gab-request', id: id, method: method, params: params || {} });
        setTimeout(function(){
          if (pending[id]){ pending[id].reject(new Error('SDK request timed out: ' + method)); delete pending[id]; }
        }, 30000);
      });
    }
    window.addEventListener('message', function(ev){
      var d = ev.data;
      if (!d || d.type !== 'gab-response' || !d.id) return;
      var p = pending[d.id]; if (!p) return;
      delete pending[d.id];
      if (d.ok) p.resolve(d.data); else p.reject(new Error(d.error || 'SDK error'));
    });

    window.gab = {
      getTables:    function(){ return call('getTables'); },
      getFields:    function(p){ return call('getFields', p); },
      getRecords:   function(p){ return call('getRecords', p); },
      createRecord: function(p){ return call('createRecord', p); },
      updateRecord: function(p){ return call('updateRecord', p); },
      deleteRecord: function(p){ return call('deleteRecord', p); },
      getForms:     function(){ return call('getForms'); }
    };

    function el(tag, attrs, children){
      attrs = attrs || {};
      attrs.className = (attrs.className || '') + (attrs.cls ? ' ' + attrs.cls : '');
      delete attrs.cls;
      return React.createElement(tag, attrs, children);
    }
    window.h = React.createElement;

    var omegaCss = [
      ".om-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border-radius:6px;border:1px solid transparent;font-size:14px;font-weight:500;cursor:pointer;background:hsl(var(--primary,221 83% 53%));color:hsl(var(--primary-foreground,0 0% 100%))}",
      ".om-btn-outline{background:transparent;border-color:hsl(var(--border,214 32% 91%));color:hsl(var(--foreground,222 47% 11%))}",
      ".om-card{background:hsl(var(--card,0 0% 100%));border:1px solid hsl(var(--border,214 32% 91%));border-radius:8px;padding:16px}",
      ".om-h1,.om-h2,.om-h3{font-weight:600;color:hsl(var(--foreground,222 47% 11%));margin:0 0 8px}",
      ".om-h1{font-size:24px}.om-h2{font-size:20px}.om-h3{font-size:16px}",
      ".om-text{font-size:14px;color:hsl(var(--foreground,222 47% 11%));line-height:1.45}",
      ".om-muted{color:hsl(var(--muted-foreground,215 16% 46%));font-size:12px}",
      ".om-input{display:block;width:100%;padding:8px 10px;border:1px solid hsl(var(--border,214 32% 91%));border-radius:6px;font-size:14px;background:hsl(var(--background,0 0% 100%));color:hsl(var(--foreground,222 47% 11%))}"
    ].join('');
    var s = document.createElement('style'); s.textContent = omegaCss; document.head.appendChild(s);

    window.OMEGA_UI = {
      Button: function(p){ return el('button', { type: 'button', className: 'om-btn ' + (p.variant === 'outline' ? 'om-btn-outline' : ''), onClick: p.onClick, disabled: p.disabled }, p.children); },
      Card:   function(p){ return el('div', { className: 'om-card', style: p.style }, p.children); },
      Heading:function(p){ var lvl = p.as || 'h2'; return el(lvl, { className: 'om-' + lvl }, p.children); },
      Text:   function(p){ return el('p', { className: 'om-text ' + (p.muted ? 'om-muted' : '') }, p.children); },
      Input:  function(p){ return el('input', { className: 'om-input', value: p.value, onChange: p.onChange, placeholder: p.placeholder }); }
    };

    window.addEventListener('error', function(e){ post({ type: 'gab:error', message: e.message || 'error' }); });
    window.addEventListener('unhandledrejection', function(e){ post({ type: 'gab:error', message: (e.reason && e.reason.message) || 'unhandled' }); });

    function reportSize(){
      var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, 60);
      post({ type: 'gab:resize', height: h });
    }
    var ro = new ResizeObserver(reportSize);
    ro.observe(document.body);
    setTimeout(reportSize, 50);

    post({ type: 'gab:ready' });
  })();
  `;
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
  <script>${buildRuntimeScript()}</script>
  <script>${safeForScriptTag(buildMountScript(opts.code))}</script>
</body>
</html>`;
}
