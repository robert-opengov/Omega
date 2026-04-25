'use client';

import {
  Checkbox,
  Input,
  MaskedInput,
  NumberInput,
  RadioGroup,
  Select,
  Textarea,
} from '@/components/ui/atoms';
import { Combobox } from '@/components/ui/molecules/Combobox';
import { DatePicker } from '@/components/ui/molecules/DatePicker';
import { FileUpload } from '@/components/ui/molecules/FileUpload';
import { AddressInput } from '@/components/ui/molecules/AddressInput';
import { TagInput } from '@/components/ui/molecules/TagInput';
import { FormField } from '@/components/ui/molecules/FormField';
import type { FieldLayoutItem } from '@/lib/core/ports/form.repository';
import type { RuntimeField } from '../types';

interface FieldItemProps {
  item: FieldLayoutItem;
  field?: RuntimeField;
  value: unknown;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  onChange: (key: string, value: unknown) => void;
}

function selectOptions(field?: RuntimeField): Array<{ label: string; value: string }> {
  const raw = (field?.config as any)?.options;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((opt) => {
      if (typeof opt === 'string') return { label: opt, value: opt };
      if (opt && typeof opt === 'object') {
        const value = String((opt as any).value ?? (opt as any).label ?? '');
        const label = String((opt as any).label ?? (opt as any).value ?? value);
        return value ? { label, value } : null;
      }
      return null;
    })
    .filter((opt): opt is { label: string; value: string } => Boolean(opt));
}

export function FieldItem({
  item,
  field,
  value,
  error,
  required,
  readOnly,
  onChange,
}: Readonly<FieldItemProps>) {
  const key = field?.key ?? item.fieldId;
  const label = item.label ?? field?.name ?? item.fieldId;
  const helpText = item.helpText;
  const options = selectOptions(field);
  const disabled = Boolean(readOnly);
  const fieldType = field?.type ?? 'text';

  const control = (() => {
    switch (fieldType) {
      case 'textarea':
      case 'long_text':
        return (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            placeholder={item.placeholder}
            disabled={disabled}
            onChange={(event) => onChange(key, event.target.value)}
          />
        );
      case 'number':
      case 'currency':
      case 'integer':
        return (
          <NumberInput
            value={typeof value === 'number' ? value : Number(value ?? 0)}
            onChange={(next) => onChange(key, next)}
            disabled={disabled}
          />
        );
      case 'checkbox':
      case 'boolean':
        return (
          <div className="pt-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(next) => onChange(key, next === true)}
              disabled={disabled}
            />
          </div>
        );
      case 'radio':
        return (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(next) => onChange(key, next)}
            disabled={disabled}
            items={options.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        );
      case 'select':
        return (
          <Select
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(key, event.target.value)}
            disabled={disabled}
          >
            <option value="">{item.placeholder ?? 'Select an option'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        );
      case 'multiselect':
        return (
          <Combobox
            multiple
            values={Array.isArray(value) ? (value as string[]) : []}
            onValuesChange={(next) => onChange(key, next)}
            options={options}
            disabled={disabled}
            placeholder={item.placeholder ?? 'Select options'}
          />
        );
      case 'combobox':
      case 'reference':
        return (
          <Combobox
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => onChange(key, next)}
            options={options}
            disabled={disabled}
            placeholder={item.placeholder ?? 'Select option'}
          />
        );
      case 'date':
        return (
          <DatePicker
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => onChange(key, next)}
            disabled={disabled}
          />
        );
      case 'datetime':
      case 'datetime-local':
        return (
          <Input
            type="datetime-local"
            value={typeof value === 'string' ? value : ''}
            disabled={disabled}
            onChange={(event) => onChange(key, event.target.value)}
          />
        );
      case 'file':
      case 'attachment':
        return (
          <FileUpload
            onFilesChange={(files) => onChange(key, files)}
          />
        );
      case 'address':
        return (
          <AddressInput
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => onChange(key, next)}
            onSelect={(location) => onChange(key, location.address)}
            disabled={disabled}
            placeholder={item.placeholder ?? 'Search address'}
          />
        );
      case 'tags':
        return (
          <TagInput
            tags={Array.isArray(value) ? value.map(String) : []}
            onTagsChange={(next) => onChange(key, next)}
          />
        );
      case 'masked':
        return (
          <MaskedInput
            mask={String((field?.config as any)?.mask ?? '###-###')}
            value={typeof value === 'string' ? value : ''}
            onChange={(next) => onChange(key, next)}
            disabled={disabled}
          />
        );
      default:
        return (
          <Input
            value={typeof value === 'string' ? value : String(value ?? '')}
            placeholder={item.placeholder}
            disabled={disabled}
            onChange={(event) => onChange(key, event.target.value)}
          />
        );
    }
  })();

  return (
    <FormField
      label={label}
      required={required ?? item.required}
      error={error}
      hint={helpText}
    >
      {control}
    </FormField>
  );
}
