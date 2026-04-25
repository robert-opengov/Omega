'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import type { GabCustomComponent as CustomComponent } from '@/lib/core/ports/custom-components.repository';
import { getCustomComponentAction } from '@/app/actions/custom-components';
import { buildSandboxSrcDoc } from '@/lib/page-builder/iframe-sandbox';
import { useIframeSdkBridge } from '@/lib/page-builder/iframe-bridge';

export interface CustomComponentBlockProps {
  appId: string;
  componentKey: string;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
}

/**
 * Renders a user-defined custom component inside a sandboxed iframe.
 * Resolves the component code via a server action, then mounts an iframe
 * whose `srcDoc` includes a slim runtime + a `postMessage` SDK bridge.
 */
export function CustomComponentBlock({
  appId,
  componentKey,
  props,
  dataBinding,
}: CustomComponentBlockProps) {
  const [comp, setComp] = useState<CustomComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getCustomComponentAction(appId, componentKey).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setComp(res.data);
      } else {
        setError(res.error ?? `Failed to load component ${componentKey}`);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appId, componentKey]);

  const srcDoc = useMemo(() => {
    if (!comp) return null;
    return buildSandboxSrcDoc({
      code: comp.code,
      props,
      dataBinding,
      componentKey,
    });
  }, [comp, props, dataBinding, componentKey]);

  useIframeSdkBridge({
    appId,
    iframeRef,
    onResize: setHeight,
    onError: (m) => setError(m),
  });

  if (error) {
    return (
      <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
        Custom component <code>{componentKey}</code>: {error}
      </div>
    );
  }
  if (!comp || !srcDoc) {
    return <div className="h-16 w-full animate-pulse rounded bg-muted/30" />;
  }

  return (
    <iframe
      ref={iframeRef}
      title={`custom-${componentKey}`}
      sandbox="allow-scripts"
      className="w-full rounded border border-border bg-card"
      style={{ height }}
      srcDoc={srcDoc}
    />
  );
}

