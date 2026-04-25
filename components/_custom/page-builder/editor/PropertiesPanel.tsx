'use client';

import { useMemo, type ChangeEvent } from 'react';
import { Input, Textarea, Label, Switch, Select, Text, NumberInput } from '@/components/ui/atoms';
import type { PageComponent, PageRow } from '@/lib/core/ports/pages.repository';
import type { PropDefinition } from '@/lib/page-builder/page-component-registry';
import { pageComponentRegistry } from '@/lib/page-builder/page-component-registry';
import { DataBindingEditor } from './DataBindingEditor';
import { cn } from '@/lib/utils';

export interface PropertiesPanelProps {
  appId: string;
  component: PageComponent;
  row: PageRow;
  onUpdateProps: (next: Record<string, unknown>) => void;
  onUpdateBinding: (next: PageComponent['dataBinding']) => void;
  onUpdateLayout: (patch: { colSpan?: number; colSpanMd?: number; colSpanSm?: number }) => void;
  onUpdateStyle: (style: PageComponent['style']) => void;
}

/**
 * Typed properties panel — replaces the JSON textarea with one editor per
 * `PropDefinition` declared by the component. Falls back to a JSON textarea
 * for unknown components so adapters never lock the editor out.
 */
export function PropertiesPanel({
  appId,
  component,
  row,
  onUpdateProps,
  onUpdateBinding,
  onUpdateLayout,
  onUpdateStyle,
}: PropertiesPanelProps) {
  const def = useMemo(
    () => pageComponentRegistry.get(component.type),
    [component.type],
  );

  const handlePropChange = (key: string, value: unknown) => {
    onUpdateProps({ ...component.props, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Text size="xs" color="muted" className="uppercase tracking-wide">
          {def?.label ?? 'Block'}
        </Text>
        <Text size="xs" color="muted">
          <code>{component.type}</code>
        </Text>
      </div>

      <Section title="Properties">
        {def && def.props.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {def.props
              .filter((p) => !p.visibleWhen || p.visibleWhen(component.props))
              .map((p) => (
                <PropEditor
                  key={p.key}
                  def={p}
                  value={component.props[p.key]}
                  onChange={(v) => handlePropChange(p.key, v)}
                />
              ))}
          </div>
        ) : (
          <JsonEditor
            value={component.props}
            onChange={(v) => {
              if (v && typeof v === 'object' && !Array.isArray(v)) {
                onUpdateProps(v as Record<string, unknown>);
              }
            }}
            label="Props (JSON)"
            help={
              def
                ? 'This block has no typed properties. Edit raw JSON.'
                : 'Unknown block type — using raw JSON editor.'
            }
          />
        )}
      </Section>

      {def?.dataShape && def.dataShape !== 'none' && (
        <Section title="Data binding">
          <DataBindingEditor
            appId={appId}
            shape={def.dataShape}
            value={component.dataBinding}
            onChange={onUpdateBinding}
          />
        </Section>
      )}

      <Section title="Layout">
        <div className="grid grid-cols-3 gap-2">
          <ColSpanField
            label="Cols (lg)"
            max={row.columns}
            value={component.colSpan}
            onChange={(v) => onUpdateLayout({ colSpan: v })}
          />
          <ColSpanField
            label="Cols (md)"
            max={row.columnsMd ?? row.columns}
            value={component.colSpanMd}
            onChange={(v) => onUpdateLayout({ colSpanMd: v })}
          />
          <ColSpanField
            label="Cols (sm)"
            max={row.columnsSm ?? 1}
            value={component.colSpanSm}
            onChange={(v) => onUpdateLayout({ colSpanSm: v })}
          />
        </div>
      </Section>

      <Section title="Style">
        <StyleEditor style={component.style ?? {}} onChange={onUpdateStyle} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Text size="xs" color="muted" className="font-semibold uppercase tracking-wide">
        {title}
      </Text>
      {children}
    </div>
  );
}

// ─── Individual editors ────────────────────────────────────────────────────

function PropEditor({
  def,
  value,
  onChange,
}: {
  def: PropDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const span = def.span === 2 ? 'col-span-2' : 'col-span-1';

  return (
    <div className={cn('flex flex-col gap-1', span)}>
      <Label htmlFor={`prop-${def.key}`} className="text-xs">
        {def.label}
      </Label>
      <EditorByType def={def} value={value} onChange={onChange} />
      {def.description && (
        <Text size="xs" color="muted" className="leading-tight">
          {def.description}
        </Text>
      )}
    </div>
  );
}

function EditorByType({
  def,
  value,
  onChange,
}: {
  def: PropDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = `prop-${def.key}`;
  switch (def.editor) {
    case 'string':
      return (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      );
    case 'multiline':
      return (
        <Textarea
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          className="min-h-[80px]"
        />
      );
    case 'number':
      return (
        <NumberInput
          id={id}
          value={typeof value === 'number' ? value : undefined}
          onChange={(v) => onChange(typeof v === 'number' ? v : undefined)}
        />
      );
    case 'boolean':
      return (
        <Switch
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    case 'select':
      return (
        <Select
          id={id}
          value={typeof value === 'string' ? value : (def.defaultValue as string) ?? ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        >
          {def.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      );
    case 'color':
      return (
        <input
          id={id}
          type="color"
          value={typeof value === 'string' ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full rounded border border-border bg-background"
        />
      );
    case 'icon':
      return (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder="LucideIconName"
        />
      );
    case 'list':
      return (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder="Comma, separated, items"
        />
      );
    case 'json':
      return (
        <JsonEditor
          value={(typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>}
          onChange={onChange}
        />
      );
    case 'block-ref':
    case 'children-slot':
      return (
        <Text size="xs" color="muted">
          Edit children directly on the canvas.
        </Text>
      );
    default:
      return null;
  }
}

function JsonEditor({
  value,
  onChange,
  label,
  help,
}: {
  value: Record<string, unknown> | unknown;
  onChange: (v: unknown) => void;
  label?: string;
  help?: string;
}) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '{}';
    }
  }, [value]);
  return (
    <div className="space-y-1">
      {label && <Label className="text-xs">{label}</Label>}
      <Textarea
        value={text}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            /* keep last valid value */
          }
        }}
        className="font-mono text-xs min-h-[120px]"
      />
      {help && (
        <Text size="xs" color="muted">
          {help}
        </Text>
      )}
    </div>
  );
}

function ColSpanField({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max: number;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value !== undefined ? String(value) : 'auto'}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value;
          onChange(v === 'auto' ? undefined : Number(v));
        }}
      >
        <option value="auto">auto ({max})</option>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </Select>
    </div>
  );
}

function StyleEditor({
  style,
  onChange,
}: {
  style: NonNullable<PageComponent['style']>;
  onChange: (s: PageComponent['style']) => void;
}) {
  function update(key: string, value: string) {
    const next = { ...style };
    if (value === '') delete next[key];
    else next[key] = value;
    onChange(Object.keys(next).length > 0 ? next : undefined);
  }
  const fields: Array<{ key: string; label: string; placeholder?: string }> = [
    { key: 'background', label: 'Background', placeholder: 'transparent' },
    { key: 'padding', label: 'Padding', placeholder: '8px' },
    { key: 'border', label: 'Border', placeholder: '1px solid #e2e8f0' },
    { key: 'borderRadius', label: 'Radius', placeholder: '6px' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <Label className="text-xs">{f.label}</Label>
          <Input
            value={typeof style[f.key] === 'string' ? (style[f.key] as string) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
          />
        </div>
      ))}
    </div>
  );
}
