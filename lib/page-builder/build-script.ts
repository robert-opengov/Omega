/**
 * Builds the JavaScript runtime injected into the custom-component
 * iframe. Mirrors the structure of GAB Core's `gab-sdk.ts` but is
 * Omega-flavored (window.gab + window.OMEGA_UI).
 *
 * The script is shaped at build-time by `services.pageSdkExtended` —
 * when the flag is OFF the extended branches and form-widget channel
 * are simply omitted from the source string. That guarantees a
 * sandboxed runtime can never reach the new surface even if a stale
 * client tries to invoke it.
 *
 * Removal recipe: flip `services.pageSdkExtended` off, confirm green,
 * delete this module + the matching server-action branches + update
 * the SDK union type.
 */

export interface BuildRuntimeScriptOptions {
  /** True when `services.pageSdkExtended` is on for this request. */
  extended: boolean;
}

const EXTENDED_METHOD_BLOCK = `
      getRelatedRecords: function(p){ return call('getRelatedRecords', p); },
      getDocuments:      function(p){ return call('getDocuments', p); },
      uploadDocument:    function(p){ return call('uploadDocument', p); },
      // Form-widget channel: getFormValues reads the local cache populated
      // via 'gab-form-values'; setFormFieldValue posts to the parent.
      getFormValues:     function(){ return Promise.resolve(_formValues); },
      setFormFieldValue: function(p){
        try {
          parent.postMessage({
            type: 'gab-form-set-field',
            field: (p && p.field) || (p && p.fieldName) || '',
            value: p ? p.value : undefined
          }, '*');
        } catch(e){}
        return Promise.resolve({ ok: true });
      },
`;

const FORM_WIDGET_CHANNEL_BLOCK = `
    var _formValues = {};
    var _formFields = [];
    var _formReadOnly = false;
    window.addEventListener('message', function(ev){
      var d = ev.data;
      if (!d || d.type !== 'gab-form-values') return;
      _formValues = d.values || {};
      _formFields = d.fields || [];
      _formReadOnly = !!d.readOnly;
    });
`;

/**
 * Returns the string body of the iframe runtime script. The caller
 * should wrap it in a `<script>` tag and inject it into `srcDoc`.
 */
export function buildIframeRuntimeScript({ extended }: BuildRuntimeScriptOptions): string {
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

    ${extended ? FORM_WIDGET_CHANNEL_BLOCK : ''}

    window.gab = {
      getTables:    function(){ return call('getTables'); },
      getFields:    function(p){ return call('getFields', p); },
      getRecords:   function(p){ return call('getRecords', p); },
      createRecord: function(p){ return call('createRecord', p); },
      updateRecord: function(p){ return call('updateRecord', p); },
      deleteRecord: function(p){ return call('deleteRecord', p); },
      getForms:     function(){ return call('getForms'); }${extended ? ',' : ''}
      ${extended ? EXTENDED_METHOD_BLOCK : ''}
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
