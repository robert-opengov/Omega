'use client';

import { Button, Input, Textarea } from '@/components/ui/atoms';
import type { FormLayoutSection } from '@/lib/core/ports/form.repository';
import { DisplayModeSelector } from './DisplayModeSelector';

interface SectionEditorProps {
  section: FormLayoutSection;
  onChange: (patch: Partial<FormLayoutSection>) => void;
  onAddSection: () => void;
}

export function SectionEditor({ section, onChange, onAddSection }: Readonly<SectionEditorProps>) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Section</h3>
      <Input
        placeholder="Section title"
        value={section.title ?? ''}
        onChange={(event) => onChange({ title: event.target.value })}
      />
      <Textarea
        placeholder="Description"
        value={section.description ?? ''}
        onChange={(event) => onChange({ description: event.target.value })}
      />
      <DisplayModeSelector
        value={section.displayMode ?? 'stacked'}
        onChange={(displayMode) => onChange({ displayMode })}
      />
      <Button type="button" variant="outline" size="sm" onClick={onAddSection}>
        Add section
      </Button>
    </div>
  );
}
