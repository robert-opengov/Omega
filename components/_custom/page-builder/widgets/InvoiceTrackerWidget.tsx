'use client';

import { Receipt } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function InvoiceTrackerWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={Receipt}
      label="Invoice Tracker"
      description="Invoice ledger with status, aging buckets, and quick approve/reject actions."
      expectedFields={['invoiceNumber', 'amount', 'status', 'dueDate']}
      notes="Implementation pending — status transitions delegate to gabDataRepo.update."
    />
  );
}
