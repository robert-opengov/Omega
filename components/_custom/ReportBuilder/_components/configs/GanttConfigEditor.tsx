'use client';

import { Select } from '@/components/ui/atoms';
import { FormField } from '@/components/ui/molecules';
import type { GanttReportConfig } from '@/lib/core/ports/report.repository';
import type { GabField } from '@/lib/core/ports/field.repository';

export interface GanttConfigEditorProps {
  config: GanttReportConfig;
  onChange: (next: GanttReportConfig) => void;
  fields: GabField[];
  disabled?: boolean;
}

const DATE_TYPES = new Set(['date', 'datetime', 'datetime-local', 'timestamp']);
const NUMERIC_TYPES = new Set([
  'number',
  'integer',
  'decimal',
  'float',
  'percent',
  'currency',
]);

function isDateLike(field: GabField): boolean {
  const t = field.type?.toLowerCase() ?? '';
  return DATE_TYPES.has(t) || t.includes('date');
}

function isNumericLike(field: GabField): boolean {
  const t = field.type?.toLowerCase() ?? '';
  return NUMERIC_TYPES.has(t) || t.includes('number');
}

export function GanttConfigEditor({
  config,
  onChange,
  fields,
  disabled,
}: Readonly<GanttConfigEditorProps>) {
  const dateFields = fields.filter(isDateLike);
  const numericFields = fields.filter(isNumericLike);
  const update = (patch: Partial<GanttReportConfig>) =>
    onChange({ ...config, ...patch });

  return (
    <div className="space-y-3">
      <FormField label="Task name field">
        <Select
          value={config.taskField ?? ''}
          onChange={(e) => update({ taskField: e.target.value || undefined })}
          aria-label="Gantt task field"
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
      <FormField label="Start date field">
        <Select
          value={config.startDateField ?? ''}
          onChange={(e) => update({ startDateField: e.target.value || undefined })}
          aria-label="Gantt start date"
          disabled={disabled}
        >
          <option value="">Select date field…</option>
          {dateFields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="End date field">
        <Select
          value={config.endDateField ?? ''}
          onChange={(e) => update({ endDateField: e.target.value || undefined })}
          aria-label="Gantt end date"
          disabled={disabled}
        >
          <option value="">Select date field…</option>
          {dateFields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Progress field (optional)" hint="Numeric 0–100.">
        <Select
          value={config.progressField ?? ''}
          onChange={(e) => update({ progressField: e.target.value || undefined })}
          aria-label="Gantt progress"
          disabled={disabled}
        >
          <option value="">No progress</option>
          {numericFields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
