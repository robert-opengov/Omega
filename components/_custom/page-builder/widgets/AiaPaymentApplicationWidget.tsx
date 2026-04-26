'use client';

import { FileSpreadsheet } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function AiaPaymentApplicationWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={FileSpreadsheet}
      label="AIA Payment Application"
      description="AIA G702/G703-style payment application with line-item draws and retainage."
      expectedFields={['lineItem', 'scheduledValue', 'workCompleted', 'retainage']}
      notes="Implementation pending — generates a printable PDF of the form."
    />
  );
}
