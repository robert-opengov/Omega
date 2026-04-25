'use client';

import { Select } from '@/components/ui/atoms';
import { FormField } from '@/components/ui/molecules';
import type {
  PivotAggregator,
  PivotReportConfig,
} from '@/lib/core/ports/report.repository';
import type { GabField } from '@/lib/core/ports/field.repository';

export interface PivotConfigEditorProps {
  config: PivotReportConfig;
  onChange: (next: PivotReportConfig) => void;
  fields: GabField[];
  disabled?: boolean;
}

const AGGREGATORS: { value: PivotAggregator; label: string }[] = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
];

function single(arr: string[] | undefined): string {
  return arr && arr.length > 0 ? arr[0] : '';
}

export function PivotConfigEditor({
  config,
  onChange,
  fields,
  disabled,
}: Readonly<PivotConfigEditorProps>) {
  const update = (patch: Partial<PivotReportConfig>) =>
    onChange({ ...config, ...patch });

  return (
    <div className="space-y-3">
      <FormField label="Rows" hint="Group records by this field along the rows.">
        <Select
          value={single(config.rows)}
          onChange={(e) => update({ rows: e.target.value ? [e.target.value] : [] })}
          aria-label="Pivot rows"
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
      <FormField label="Columns (optional)">
        <Select
          value={single(config.cols)}
          onChange={(e) => update({ cols: e.target.value ? [e.target.value] : [] })}
          aria-label="Pivot columns"
          disabled={disabled}
        >
          <option value="">No columns</option>
          {fields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Aggregator">
        <Select
          value={config.aggregatorName ?? 'count'}
          onChange={(e) =>
            update({ aggregatorName: e.target.value as PivotAggregator })
          }
          aria-label="Pivot aggregator"
          disabled={disabled}
        >
          {AGGREGATORS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Value field">
        <Select
          value={single(config.vals)}
          onChange={(e) => update({ vals: e.target.value ? [e.target.value] : [] })}
          aria-label="Pivot value field"
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
    </div>
  );
}
