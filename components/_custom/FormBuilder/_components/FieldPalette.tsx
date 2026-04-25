'use client';

import { Button } from '@/components/ui/atoms';
import type { RuntimeField } from '@/components/_custom/FormRuntime';

interface FieldPaletteProps {
  fields: RuntimeField[];
  usedFieldIds: string[];
  onAddField: (fieldId: string) => void;
  onAddItem: (type: 'header' | 'divider' | 'text' | 'button' | 'button-group' | 'child-grid' | 'child-section') => void;
}

export function FieldPalette({
  fields,
  usedFieldIds,
  onAddField,
  onAddItem,
}: Readonly<FieldPaletteProps>) {
  const available = fields.filter((field) => !usedFieldIds.includes(field.id));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Field Palette</h3>
      <div className="space-y-1">
        {available.map((field) => (
          <Button
            key={field.id}
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onAddField(field.id)}
          >
            {field.name}
          </Button>
        ))}
      </div>
      <div className="space-y-1">
        {(['header', 'divider', 'text', 'button', 'button-group', 'child-grid', 'child-section'] as const).map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start capitalize"
            onClick={() => onAddItem(type)}
          >
            {type}
          </Button>
        ))}
      </div>
    </div>
  );
}
