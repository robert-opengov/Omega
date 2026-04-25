'use client';

import { RadioGroup } from '@/components/ui/atoms';
import type { FormDisplayMode } from '@/lib/core/ports/form.repository';

interface DisplayModeSelectorProps {
  value: FormDisplayMode;
  onChange: (mode: FormDisplayMode) => void;
}

export function DisplayModeSelector({ value, onChange }: Readonly<DisplayModeSelectorProps>) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as FormDisplayMode)}
      items={[
        { value: 'stacked', label: 'Stacked' },
        { value: 'tabs', label: 'Tabs' },
        { value: 'wizard', label: 'Wizard' },
      ]}
      className="flex-row gap-4"
    />
  );
}
