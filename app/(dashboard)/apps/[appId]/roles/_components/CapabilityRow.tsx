'use client';

import { Checkbox } from '@/components/ui/atoms';
import type { ManagementCapability } from '@/lib/core/ports/app-role.repository';

const CAPABILITY_LABELS: Record<ManagementCapability, string> = {
  manage_forms: 'Manage forms',
  manage_reports: 'Manage reports',
  import_data: 'Import data',
  view_table: 'View table',
  view_report: 'View report',
};

const CAPABILITY_KEYS = Object.keys(CAPABILITY_LABELS) as ManagementCapability[];

interface CapabilityRowProps {
  enabled: Set<ManagementCapability>;
  onToggle: (capability: ManagementCapability, enabled: boolean) => void;
  disabled?: boolean;
}

export function CapabilityRow({ enabled, onToggle, disabled }: CapabilityRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {CAPABILITY_KEYS.map((cap) => (
        <div
          key={cap}
          className="rounded border border-border bg-background px-3 py-2"
        >
          <Checkbox
            checked={enabled.has(cap)}
            onCheckedChange={(checked) => onToggle(cap, Boolean(checked))}
            disabled={disabled}
            label={CAPABILITY_LABELS[cap]}
          />
        </div>
      ))}
    </div>
  );
}
