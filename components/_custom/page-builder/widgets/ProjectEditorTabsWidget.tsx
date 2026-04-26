'use client';

import { LayoutPanelTop } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function ProjectEditorTabsWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={LayoutPanelTop}
      label="Project Editor Tabs"
      description="Tabbed project editor (Overview / Budget / Schedule / Documents) for one record."
      expectedFields={['recordId']}
      notes="Implementation pending — wraps the page-builder record context with sub-tabs."
    />
  );
}
