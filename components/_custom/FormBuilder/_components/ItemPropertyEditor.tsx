'use client';

import { Input, Switch, Textarea } from '@/components/ui/atoms';
import { ExpressionEditor } from './ExpressionEditor';
import type { FormLayoutItem } from '@/lib/core/ports/form.repository';

interface ItemPropertyEditorProps {
  item: FormLayoutItem;
  onChange: (patch: Partial<FormLayoutItem>) => void;
}

export function ItemPropertyEditor({ item, onChange }: Readonly<ItemPropertyEditorProps>) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Item Properties</h3>
      {'label' in item ? (
        <Input
          placeholder="Label"
          value={item.label ?? ''}
          onChange={(event) => onChange({ label: event.target.value } as Partial<FormLayoutItem>)}
        />
      ) : null}
      {'text' in item ? (
        <Textarea
          placeholder="Text"
          value={item.text ?? ''}
          onChange={(event) => onChange({ text: event.target.value } as Partial<FormLayoutItem>)}
        />
      ) : null}
      {'placeholder' in item ? (
        <Input
          placeholder="Placeholder"
          value={item.placeholder ?? ''}
          onChange={(event) =>
            onChange({ placeholder: event.target.value } as Partial<FormLayoutItem>)
          }
        />
      ) : null}
      {'required' in item ? (
        <div className="flex items-center gap-2 text-sm">
          <Switch
            checked={Boolean(item.required)}
            onCheckedChange={(checked) =>
              onChange({ required: checked } as Partial<FormLayoutItem>)
            }
          />
          Required
        </div>
      ) : null}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Inline visibility rule</p>
        <ExpressionEditor
          value={item.visibleIf ?? ''}
          onChange={(value) => onChange({ visibleIf: value } as Partial<FormLayoutItem>)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Inline required rule</p>
        <ExpressionEditor
          value={item.requiredIf ?? ''}
          onChange={(value) => onChange({ requiredIf: value } as Partial<FormLayoutItem>)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Inline read-only rule</p>
        <ExpressionEditor
          value={item.readOnlyIf ?? ''}
          onChange={(value) => onChange({ readOnlyIf: value } as Partial<FormLayoutItem>)}
        />
      </div>
    </div>
  );
}
