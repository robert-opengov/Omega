'use client';

import { Select } from '@/components/ui/atoms';
import { FormField } from '@/components/ui/molecules';
import type {
  ChartKind,
  ChartReportConfig,
} from '@/lib/core/ports/report.repository';
import type { GabField } from '@/lib/core/ports/field.repository';

export interface ChartConfigEditorProps {
  config: ChartReportConfig;
  onChange: (next: ChartReportConfig) => void;
  fields: GabField[];
  disabled?: boolean;
}

const CHART_KINDS: { value: ChartKind; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
];

export function ChartConfigEditor({
  config,
  onChange,
  fields,
  disabled,
}: Readonly<ChartConfigEditorProps>) {
  const update = (patch: Partial<ChartReportConfig>) =>
    onChange({ ...config, ...patch });

  return (
    <div className="space-y-3">
      <FormField label="Chart type">
        <Select
          value={config.chartType ?? 'bar'}
          onChange={(e) => update({ chartType: e.target.value as ChartKind })}
          aria-label="Chart type"
          disabled={disabled}
        >
          {CHART_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="X axis (category)">
        <Select
          value={config.xAxis ?? ''}
          onChange={(e) => update({ xAxis: e.target.value || undefined })}
          aria-label="Chart x axis"
          disabled={disabled}
        >
          <option value="">Select field…</option>
          {fields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Y axis (value)">
        <Select
          value={config.yAxis ?? ''}
          onChange={(e) => update({ yAxis: e.target.value || undefined })}
          aria-label="Chart y axis"
          disabled={disabled}
        >
          <option value="">Select field…</option>
          {fields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Series (optional)">
        <Select
          value={config.series ?? ''}
          onChange={(e) => update({ series: e.target.value || undefined })}
          aria-label="Chart series"
          disabled={disabled}
        >
          <option value="">No series</option>
          {fields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
