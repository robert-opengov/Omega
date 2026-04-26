'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DataBinding } from '@/lib/core/ports/pages.repository';
import type { GabCustomComponent as CustomComponent } from '@/lib/core/ports/custom-components.repository';
import { getCustomComponentAction } from '@/app/actions/custom-components';
import { buildSandboxSrcDoc } from '@/lib/page-builder/iframe-sandbox';
import { useIframeSdkBridge } from '@/lib/page-builder/iframe-bridge';
import { useModuleEnabled } from '@/providers/module-flags-provider';
import type { FormWidgetContext } from '@/lib/page-builder/iframe-bridge';

export interface CustomComponentBlockProps {
  appId: string;
  componentKey: string;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
  /**
   * Optional form-widget context — provided when the custom component is
   * embedded inside a Form widget so it can read live values and write
   * fields back. Only forwarded when `services.pageSdkExtended` is on.
   */
  formContext?: FormWidgetContext;
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
  formContext,
}: CustomComponentBlockProps) {
  const [comp, setComp] = useState<CustomComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);
  const extendedSdk = useModuleEnabled('services.pageSdkExtended');

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
      extendedSdk,
    });
  }, [comp, props, dataBinding, componentKey, extendedSdk]);

  useIframeSdkBridge({
    appId,
    iframeRef,
    onResize: setHeight,
    onError: (m) => setError(m),
    formContext: extendedSdk ? formContext : undefined,
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

