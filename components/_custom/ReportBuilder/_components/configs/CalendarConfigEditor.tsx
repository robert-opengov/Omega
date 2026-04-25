'use client';

import { Select } from '@/components/ui/atoms';
import { FormField } from '@/components/ui/molecules';
import type { CalendarReportConfig } from '@/lib/core/ports/report.repository';
import type { GabField } from '@/lib/core/ports/field.repository';

export interface CalendarConfigEditorProps {
  config: CalendarReportConfig;
  onChange: (next: CalendarReportConfig) => void;
  fields: GabField[];
  disabled?: boolean;
}

const DATE_TYPES = new Set(['date', 'datetime', 'datetime-local', 'timestamp']);

function isDateLike(field: GabField): boolean {
  const t = field.type?.toLowerCase() ?? '';
  return DATE_TYPES.has(t) || t.includes('date');
}

export function CalendarConfigEditor({
  config,
  onChange,
  fields,
  disabled,
}: Readonly<CalendarConfigEditorProps>) {
  const dateFields = fields.filter(isDateLike);
  const update = (patch: Partial<CalendarReportConfig>) =>
    onChange({ ...config, ...patch });

  return (
    <div className="space-y-3">
      <FormField label="Date field" hint="Used to place events on the calendar.">
        <Select
          value={config.dateField ?? ''}
          onChange={(e) => update({ dateField: e.target.value || undefined })}
          aria-label="Calendar date field"
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
      <FormField label="End date field (optional)">
        <Select
          value={config.endDateField ?? ''}
          onChange={(e) => update({ endDateField: e.target.value || undefined })}
          aria-label="Calendar end date field"
          disabled={disabled}
        >
          <option value="">No end date</option>
          {dateFields.map((f) => (
            <option key={f.id} value={f.key}>
              {f.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Title field">
        <Select
          value={config.titleField ?? ''}
          onChange={(e) => update({ titleField: e.target.value || undefined })}
          aria-label="Calendar title field"
          disabled={disabled}
        >
          <option value="">Use record id</option>
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
