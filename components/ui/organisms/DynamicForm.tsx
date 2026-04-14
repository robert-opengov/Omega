'use client';

import { useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { evaluateRules, type FormSchema, type FormSection, type FormFieldDef, type RuleEvalResult } from '@/lib/core/ports/form-schema';
import { Input, Textarea } from '@/components/ui/atoms';
import { FormField } from '@/components/ui/molecules/FormField';
import { Combobox } from '@/components/ui/molecules/Combobox';
import { DatePicker } from '@/components/ui/molecules/DatePicker';
import { FileUpload } from '@/components/ui/molecules/FileUpload';
import { AddressInput } from '@/components/ui/molecules/AddressInput';

// ----- Field Type Registry -----

type FieldRenderer = (props: {
  def: FormFieldDef;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}) => ReactNode;

const fieldRenderers: Record<string, FieldRenderer> = {
  text: ({ def, value, onChange, disabled, error, size }) => (
    <Input
      value={(value as string) ?? ''}
      onChange={(e) => onChange(def.key, e.target.value)}
      placeholder={def.placeholder}
      disabled={disabled}
      className={size === 'sm' ? 'text-xs py-1' : size === 'lg' ? 'text-base py-2.5' : ''}
    />
  ),

  email: ({ def, value, onChange, disabled }) => (
    <Input
      type="email"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(def.key, e.target.value)}
      placeholder={def.placeholder}
      disabled={disabled}
    />
  ),

  phone: ({ def, value, onChange, disabled }) => (
    <Input
      type="tel"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(def.key, e.target.value)}
      placeholder={def.placeholder}
      disabled={disabled}
    />
  ),

  url: ({ def, value, onChange, disabled }) => (
    <Input
      type="url"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(def.key, e.target.value)}
      placeholder={def.placeholder}
      disabled={disabled}
    />
  ),

  number: ({ def, value, onChange, disabled }) => (
    <Input
      type="number"
      value={(value as string | number) ?? ''}
      onChange={(e) => onChange(def.key, e.target.value === '' ? '' : Number(e.target.value))}
      placeholder={def.placeholder}
      disabled={disabled}
      min={def.validation?.min}
      max={def.validation?.max}
    />
  ),

  textarea: ({ def, value, onChange, disabled }) => (
    <Textarea
      value={(value as string) ?? ''}
      onChange={(e) => onChange(def.key, e.target.value)}
      placeholder={def.placeholder}
      disabled={disabled}
      rows={4}
    />
  ),

  select: ({ def, value, onChange, disabled }) => (
    <Combobox
      options={def.options?.map((o) => ({ label: o.label, value: o.value })) ?? []}
      value={(value as string) ?? ''}
      onChange={(v) => onChange(def.key, v)}
      disabled={disabled}
      placeholder={def.placeholder || 'Select...'}
    />
  ),

  multiselect: ({ def, value, onChange, disabled }) => (
    <Combobox
      multiple
      options={def.options?.map((o) => ({ label: o.label, value: o.value })) ?? []}
      values={Array.isArray(value) ? (value as string[]) : []}
      onValuesChange={(v) => onChange(def.key, v)}
      disabled={disabled}
      placeholder={def.placeholder || 'Select...'}
    />
  ),

  combobox: ({ def, value, onChange, disabled }) => (
    <Combobox
      options={def.options?.map((o) => ({ label: o.label, value: o.value })) ?? []}
      value={(value as string) ?? ''}
      onChange={(v) => onChange(def.key, v)}
      disabled={disabled}
      searchable
      placeholder={def.placeholder || 'Search...'}
    />
  ),

  radio: ({ def, value, onChange, disabled }) => (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={def.label}>
      {def.options?.map((option) => (
        <label key={option.value} className={cn('flex items-center gap-2 text-sm cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
          <input
            type="radio"
            name={def.key}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(def.key, option.value)}
            disabled={disabled}
            className="accent-primary"
          />
          {option.label}
        </label>
      ))}
    </div>
  ),

  checkbox: ({ def, value, onChange, disabled }) => (
    <label className={cn('flex items-center gap-2 text-sm cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(def.key, e.target.checked)}
        disabled={disabled}
        className="accent-primary h-4 w-4 rounded"
      />
      {def.placeholder || def.label}
    </label>
  ),

  date: ({ def, value, onChange, disabled }) => (
    <DatePicker
      value={(value as string) ?? ''}
      onChange={(v) => onChange(def.key, v)}
      disabled={disabled}
    />
  ),

  datetime: ({ def, value, onChange, disabled }) => (
    <Input
      type="datetime-local"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(def.key, e.target.value)}
      placeholder={def.placeholder}
      disabled={disabled}
    />
  ),

  file: ({ def, value, onChange }) => (
    <FileUpload
      onFilesChange={(files: File[]) => onChange(def.key, files)}
    />
  ),

  address: ({ def, value, onChange, disabled }) => (
    <AddressInput
      value={(value as string) ?? ''}
      onChange={(v) => onChange(def.key, v)}
      onSelect={(loc) => onChange(def.key, loc.address)}
      placeholder={def.placeholder || 'Search for an address...'}
      disabled={disabled}
    />
  ),
};

// ----- Read-only Display -----

function DynamicFormDisplay({
  schema,
  values,
  ruleResult,
  size,
}: {
  schema: FormSchema;
  values: Record<string, unknown>;
  ruleResult: RuleEvalResult;
  size: 'sm' | 'md' | 'lg';
}) {
  const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className="space-y-6">
      {sortedSections.map((section) => {
        const visibleFields = section.fields.filter((f) => !ruleResult.hiddenFields.has(f.key));
        if (visibleFields.length === 0) return null;

        return (
          <div key={section.key}>
            <h3 className="text-base font-semibold text-foreground mb-3">{section.label}</h3>
            {section.description && <p className="text-sm text-muted-foreground mb-4">{section.description}</p>}
            <dl className={cn('grid gap-3', section.columns === 2 ? 'grid-cols-2' : section.columns === 3 ? 'grid-cols-3' : 'grid-cols-1')}>
              {visibleFields.map((field) => (
                <div key={field.key} style={field.span ? { gridColumn: `span ${field.span}` } : undefined}>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</dt>
                  <dd className={cn(textSize, 'text-foreground mt-0.5')}>{formatDisplayValue(field, values[field.key])}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function formatDisplayValue(field: FormFieldDef, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';

  if (field.type === 'checkbox') return value ? 'Yes' : 'No';

  if (field.type === 'select' || field.type === 'radio' || field.type === 'combobox') {
    const option = field.options?.find((o) => o.value === value);
    return option?.label ?? String(value);
  }

  if (field.type === 'multiselect' && Array.isArray(value)) {
    return value
      .map((v) => field.options?.find((o) => o.value === v)?.label ?? String(v))
      .join(', ');
  }

  return String(value);
}

// ----- DynamicForm Component -----

export interface DynamicFormProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  sectionRenderer?: (section: FormSection, children: ReactNode) => ReactNode;
  fieldRenderer?: (field: FormFieldDef, control: ReactNode) => ReactNode;
  className?: string;
}

/**
 * Schema-driven form component. Renders fields from a `FormSchema` definition,
 * evaluates conditional rules, and delegates to existing atoms/molecules via
 * a field type registry.
 *
 * In `readOnly` mode, renders a `dl/dt/dd` display.
 */
export function DynamicForm({
  schema,
  values,
  onChange,
  errors = {},
  disabled = false,
  readOnly = false,
  size = 'md',
  sectionRenderer,
  fieldRenderer,
  className,
}: DynamicFormProps) {
  const ruleResult = useMemo(
    () => evaluateRules(schema.rules ?? [], values),
    [schema.rules, values],
  );

  if (readOnly) {
    return <DynamicFormDisplay schema={schema} values={values} ruleResult={ruleResult} size={size} />;
  }

  const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);

  return (
    <div className={cn('space-y-8', className)}>
      {sortedSections.map((section) => {
        const visibleFields = section.fields.filter((f) => !ruleResult.hiddenFields.has(f.key));
        if (visibleFields.length === 0) return null;

        const gridCols = section.columns ?? 1;
        const gridClass = gridCols === 1 ? '' : gridCols === 2 ? 'grid grid-cols-2 gap-4' : gridCols === 3 ? 'grid grid-cols-3 gap-4' : `grid gap-4`;
        const gridStyle = gridCols > 3 ? { gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` } : undefined;

        const sectionContent = (
          <div key={section.key}>
            <h3 className="text-base font-semibold text-foreground mb-1">{section.label}</h3>
            {section.description && <p className="text-sm text-muted-foreground mb-4">{section.description}</p>}
            <div className={cn('space-y-4', gridClass)} style={gridStyle}>
              {visibleFields.map((field) => {
                const isFieldRequired = field.required || ruleResult.requiredFields.has(field.key);
                const isFieldDisabled = disabled || ruleResult.disabledFields.has(field.key);

                const renderer = fieldRenderers[field.type] ?? fieldRenderers.text;
                const control = renderer({
                  def: field,
                  value: values[field.key],
                  onChange,
                  disabled: isFieldDisabled,
                  readOnly,
                  error: errors[field.key],
                  size,
                });

                const fieldNode = field.type === 'checkbox' ? (
                  <div key={field.key} style={field.span ? { gridColumn: `span ${field.span}` } : undefined}>
                    {control}
                    {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
                    {errors[field.key] && <p className="text-xs text-destructive mt-1">{errors[field.key]}</p>}
                  </div>
                ) : (
                  <FormField
                    key={field.key}
                    label={field.label}
                    required={isFieldRequired}
                    error={errors[field.key]}
                    hint={field.helpText}
                    className={undefined}
                    style={field.span ? { gridColumn: `span ${field.span}` } : undefined}
                  >
                    {control}
                  </FormField>
                );

                return fieldRenderer ? fieldRenderer(field, fieldNode) : fieldNode;
              })}
            </div>
          </div>
        );

        return sectionRenderer ? sectionRenderer(section, sectionContent) : sectionContent;
      })}
    </div>
  );
}

export default DynamicForm;
