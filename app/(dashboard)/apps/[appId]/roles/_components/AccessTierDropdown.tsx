'use client';

import { Select } from '@/components/ui/atoms';
import type { AccessTier } from '@/lib/core/ports/app-role.repository';

const TIER_LABELS: Record<AccessTier, string> = {
  none: 'None',
  all: 'All records',
  custom: 'Custom (row filter)',
};

interface AccessTierDropdownProps {
  value: AccessTier;
  onChange: (tier: AccessTier) => void;
  disabled?: boolean;
  /** Label for accessibility. */
  ariaLabel?: string;
}

export function AccessTierDropdown({
  value,
  onChange,
  disabled,
  ariaLabel,
}: AccessTierDropdownProps) {
  return (
    <Select
      selectSize="sm"
      value={value}
      onChange={(e) => onChange(e.target.value as AccessTier)}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {(Object.keys(TIER_LABELS) as AccessTier[]).map((tier) => (
        <option key={tier} value={tier}>
          {TIER_LABELS[tier]}
        </option>
      ))}
    </Select>
  );
}
