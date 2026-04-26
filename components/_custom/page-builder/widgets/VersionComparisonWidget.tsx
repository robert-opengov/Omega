'use client';

import { GitCompare } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function VersionComparisonWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={GitCompare}
      label="Version Comparison"
      description="Side-by-side compare of two record versions with a diff summary."
      expectedFields={['recordId', 'leftVersion', 'rightVersion']}
      notes="Implementation pending — leverages record history endpoints."
    />
  );
}
