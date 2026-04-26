'use client';

import { MapPin } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function BroadbandMapWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={MapPin}
      label="Broadband Map"
      description="Geographic map of broadband service coverage and gap areas."
      expectedFields={['lat', 'lng', 'speedDown', 'speedUp', 'coverage']}
      notes="Implementation pending — overlays bind-table records on a base map."
    />
  );
}
