'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isCustomIframeMessage, type CustomIframeMessage } from '@/lib/page-builder/iframe-bridge';

const SDK_STUB = `
<script>
  (function() {
    function post(msg) {
      try { parent.postMessage(msg, '*'); } catch (e) {}
    }
    post({ type: 'gab:ready' });
    window.addEventListener('error', function(e) {
      post({ type: 'gab:error', message: e.message || 'error' });
    });
  })();
<\/script>
`;

function buildSrcDoc(_code: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 12px; }
    .box { border: 1px dashed #94a3b8; border-radius: 6px; padding: 12px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="box">Sandbox — component code is edited in Omega; full compile/preview is wired in follow-up. Bridge ready.</div>
  ${SDK_STUB}
</body>
</html>`;
}

export function CustomComponentPreviewFrame({ code }: { code: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<string>('loading');
  const srcDoc = useMemo(() => buildSrcDoc(code), [code]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as CustomIframeMessage;
      if (!isCustomIframeMessage(data)) return;
      if (data.type === 'gab:ready') setStatus('ready');
      if (data.type === 'gab:error') setStatus(`error: ${data.message}`);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="space-y-2">
      <iframe
        ref={ref}
        title="Custom component sandbox"
        sandbox="allow-scripts"
        className="w-full h-40 rounded border border-border bg-muted/30"
        srcDoc={srcDoc}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Iframe: {status}
      </p>
    </div>
  );
}
