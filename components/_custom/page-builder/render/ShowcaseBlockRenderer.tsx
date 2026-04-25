'use client';

import type { DataBinding } from '@/lib/core/ports/pages.repository';
import { renderShowcaseBlock } from './blocks-registry';

export interface ShowcaseBlockRendererProps {
  type: string;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
  appId: string;
}

/**
 * Renders one canvas block; maps `type` to UI Showcase components.
 */
export function ShowcaseBlockRenderer({
  type,
  props,
  dataBinding,
  appId,
}: ShowcaseBlockRendererProps) {
  return (
    <div className="w-full min-w-0" data-block-type={type}>
      {renderShowcaseBlock({ type, props, dataBinding, appId })}
    </div>
  );
}
