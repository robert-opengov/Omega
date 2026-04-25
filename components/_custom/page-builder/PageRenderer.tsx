'use client';

import { Suspense, type ReactNode } from 'react';
import type { PageComponent, PageLayout, PageRow } from '@/lib/core/ports/pages.repository';
import '@/lib/page-builder/registry-init';
import { pageComponentRegistry } from '@/lib/page-builder/page-component-registry';
import { renderBlock } from './render/blocks-registry';
import { CustomComponentBlock } from './render/CustomComponentBlock';
import { PageRuntimeProviders } from './runtime/PageContexts';
import { cn } from '@/lib/utils';

export interface PageRendererProps {
  layout: PageLayout;
  appId: string;
  className?: string;
  /**
   * If true (default), wraps the tree in `PageRuntimeProviders` which exposes
   * the cross-component filter + selection contexts. The editor passes
   * `withProviders={false}` when it has already wrapped the canvas.
   */
  withProviders?: boolean;
}

/**
 * Renders a persisted page layout. Supports multi-row, responsive column
 * counts (`columnsMd` / `columnsSm`), per-component `colSpan*`, container
 * recursion, and custom components. Falls through to a recursive
 * `renderChildren` callback so containers don't import the parent.
 */
export function PageRenderer({
  layout,
  appId,
  className,
  withProviders = true,
}: PageRendererProps) {
  if (!layout?.rows?.length) {
    return (
      <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded">
        This page has no content yet.
      </p>
    );
  }

  const tree = (
    <div className={cn('space-y-6', className)}>
      {layout.rows.map((row) => (
        <RowRenderer key={row.id} row={row} appId={appId} />
      ))}
    </div>
  );

  if (!withProviders) return tree;
  return <PageRuntimeProviders>{tree}</PageRuntimeProviders>;
}

function RowRenderer({ row, appId }: { row: PageRow; appId: string }) {
  // Tailwind v4 — set responsive grid template via inline CSS so authors can
  // pick any column count without forcing us to whitelist classes.
  const cols = row.columns ?? 1;
  const colsMd = row.columnsMd ?? cols;
  const colsSm = row.columnsSm ?? 1;
  const gap = row.gap ?? 16;

  return (
    <div
      className="grid w-full"
      style={{
        gap,
        gridTemplateColumns: `repeat(${colsSm}, minmax(0, 1fr))`,
        ['--cols-md' as string]: colsMd,
        ['--cols-lg' as string]: cols,
      }}
    >
      <style>{`@media (min-width: 768px){[data-row-id="${row.id}"]{grid-template-columns:repeat(${colsMd}, minmax(0, 1fr));}}@media (min-width: 1024px){[data-row-id="${row.id}"]{grid-template-columns:repeat(${cols}, minmax(0, 1fr));}}`}</style>
      <div data-row-id={row.id} className="contents" />
      {row.components.map((c) => (
        <ComponentCell key={c.id} comp={c} row={row} appId={appId} />
      ))}
    </div>
  );
}

function ComponentCell({
  comp,
  row,
  appId,
}: {
  comp: PageComponent;
  row: PageRow;
  appId: string;
}) {
  const span = clamp(comp.colSpan, row.columns);
  const spanMd = clamp(comp.colSpanMd, row.columnsMd ?? row.columns);
  const spanSm = clamp(comp.colSpanSm, row.columnsSm ?? 1);

  const inlineStyle: Record<string, string | number | undefined> = {
    gridColumn: `span ${spanSm}`,
    ...(comp.style ?? {}),
  };

  return (
    <div
      className="min-w-0"
      style={inlineStyle}
      data-block-id={comp.id}
      data-block-type={comp.type}
    >
      <Suspense fallback={<BlockSkeleton />}>
        <RenderedComponent comp={comp} appId={appId} />
      </Suspense>
      <style>{`@media(min-width:768px){[data-block-id="${comp.id}"]{grid-column:span ${spanMd};}}@media(min-width:1024px){[data-block-id="${comp.id}"]{grid-column:span ${span};}}`}</style>
    </div>
  );
}

function clamp(value: number | undefined, max: number): number {
  const v = typeof value === 'number' && value > 0 ? value : max;
  return Math.min(Math.max(v, 1), Math.max(max, 1));
}

function RenderedComponent({ comp, appId }: { comp: PageComponent; appId: string }): ReactNode {
  const def = pageComponentRegistry.get(comp.type);

  // Custom-component routing: prefer the registry's `isCustom` flag, but
  // also fall back to the `custom:` type prefix so runtime pages don't have
  // to pre-register custom components before rendering them.
  if (def?.isCustom || comp.type.startsWith('custom:')) {
    return (
      <CustomComponentBlock
        appId={appId}
        componentKey={comp.type.replace(/^custom:/, '')}
        props={comp.props}
        dataBinding={comp.dataBinding}
      />
    );
  }

  return renderBlock({
    type: comp.type,
    props: comp.props,
    dataBinding: comp.dataBinding,
    appId,
    children: comp.children,
    renderChildren: (children) =>
      children.map((child) => (
        <RenderedComponent key={child.id} comp={child} appId={appId} />
      )),
  });
}

function BlockSkeleton() {
  return (
    <div className="h-16 w-full animate-pulse rounded bg-muted/40" />
  );
}
