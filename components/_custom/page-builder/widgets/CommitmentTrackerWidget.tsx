'use client';

import { ClipboardCheck } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function CommitmentTrackerWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={ClipboardCheck}
      label="Commitment Tracker"
      description="Tracks contract commitments vs. invoiced amounts with remaining balance."
      expectedFields={['contractId', 'commitment', 'invoiced', 'remaining']}
      notes="Implementation pending — joins commitments to invoices via gabRelationshipRepo."
    />
  );
}
