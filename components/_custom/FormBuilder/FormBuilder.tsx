'use client';

import { useMemo, useState, useTransition } from 'react';
import { Button, Input } from '@/components/ui/atoms';
import { updateFormAction } from '@/app/actions/forms';
import type { FormLayoutItem, FormLayoutSection } from '@/lib/core/ports/form.repository';
import type { FormBuilderProps, BuilderSelection } from './types';
import {
  ensureLayout,
  createFieldItem,
  createRule,
  createSection,
} from './types';
import { LayoutTree } from './_components/LayoutTree';
import { FieldPalette } from './_components/FieldPalette';
import { SectionEditor } from './_components/SectionEditor';
import { ItemPropertyEditor } from './_components/ItemPropertyEditor';
import { RulesPanel } from './_components/RulesPanel';
import { DisplayModeSelector } from './_components/DisplayModeSelector';
import { LivePreview } from './_components/LivePreview';

function createItem(type: FormLayoutItem['type']): FormLayoutItem {
  const id = `item_${Math.random().toString(36).slice(2, 9)}`;
  switch (type) {
    case 'header':
      return { id, type, text: 'Header' };
    case 'divider':
      return { id, type };
    case 'text':
      return { id, type, text: 'Text block' };
    case 'button':
      return { id, type, buttonConfig: { label: 'Button', variant: 'contained', color: 'primary', action: { type: 'save' } } };
    case 'button-group':
      return { id, type, buttons: [] };
    case 'child-grid':
      return { id, type };
    case 'child-section':
      return { id, type };
    case 'widget':
      return { id, type };
    case 'field':
      return { id, type, fieldId: '' };
  }
}

export function FormBuilder({ appId, form, fields }: Readonly<FormBuilderProps>) {
  const [draftName, setDraftName] = useState(form.name);
  const [draftLayout, setDraftLayout] = useState(() => ensureLayout(form.layout));
  const [selection, setSelection] = useState<BuilderSelection>({ type: 'rules' });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSave] = useTransition();

  const selectedSection = useMemo(() => {
    if (selection.type === 'section') {
      return draftLayout.sections.find((section) => section.id === selection.sectionId) ?? null;
    }
    if (selection.type === 'item') {
      return draftLayout.sections.find((section) => section.id === selection.sectionId) ?? null;
    }
    return draftLayout.sections[0] ?? null;
  }, [draftLayout.sections, selection]);

  const selectedItem = useMemo(() => {
    if (selection.type !== 'item') return null;
    const section = draftLayout.sections.find((entry) => entry.id === selection.sectionId);
    return section?.items.find((item) => item.id === selection.itemId) ?? null;
  }, [draftLayout.sections, selection]);

  const usedFieldIds = useMemo(
    () =>
      draftLayout.sections.flatMap((section) =>
        section.items.filter((item) => item.type === 'field').map((item) => item.fieldId),
      ),
    [draftLayout.sections],
  );

  const itemOptions = useMemo(
    () =>
      draftLayout.sections.flatMap((section) =>
        section.items.map((item) => ({
          value: item.id,
          label: `${section.title ?? 'Section'} · ${item.type}`,
        })),
      ),
    [draftLayout.sections],
  );

  const updateSection = (sectionId: string, patch: Partial<FormLayoutSection>) => {
    setDraftLayout((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    }));
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<FormLayoutItem>) => {
    setDraftLayout((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? ({ ...item, ...patch } as FormLayoutItem) : item,
              ),
            },
      ),
    }));
  };

  const addSection = () => {
    setDraftLayout((prev) => ({ ...prev, sections: [...prev.sections, createSection(prev.displayMode)] }));
  };

  const addFieldItem = (fieldId: string) => {
    const sectionId = selectedSection?.id ?? draftLayout.sections[0]?.id;
    if (!sectionId) return;
    const item = createFieldItem(fieldId);
    setDraftLayout((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, items: [...section.items, item] } : section,
      ),
    }));
    setSelection({ type: 'item', sectionId, itemId: item.id });
  };

  const addStaticItem = (
    type: 'header' | 'divider' | 'text' | 'button' | 'button-group' | 'child-grid' | 'child-section',
  ) => {
    const sectionId = selectedSection?.id ?? draftLayout.sections[0]?.id;
    if (!sectionId) return;
    const item = createItem(type);
    setDraftLayout((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, items: [...section.items, item] } : section,
      ),
    }));
    setSelection({ type: 'item', sectionId, itemId: item.id });
  };

  const save = () => {
    setError(null);
    setSaved(false);
    startSave(async () => {
      const response = await updateFormAction(appId, form.id, {
        name: draftName,
        layout: draftLayout,
      });
      if (!response.success) {
        setError(response.error ?? 'Failed to save form');
        return;
      }
      setSaved(true);
    });
  };

  const reset = () => {
    setDraftName(form.name);
    setDraftLayout(ensureLayout(form.layout));
    setSelection({ type: 'rules' });
  };

  const previewForm = {
    ...form,
    name: draftName,
    layout: draftLayout,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
        <DisplayModeSelector
          value={draftLayout.displayMode ?? 'stacked'}
          onChange={(displayMode) => setDraftLayout((prev) => ({ ...prev, displayMode }))}
        />
        <Button type="button" onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Discard
        </Button>
        {saved ? <span className="text-xs text-success-text">Saved.</span> : null}
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr_360px]">
        <aside className="space-y-4 rounded border border-border p-3">
          <FieldPalette
            fields={fields}
            usedFieldIds={usedFieldIds}
            onAddField={addFieldItem}
            onAddItem={addStaticItem}
          />
          <LayoutTree
            layout={draftLayout}
            onChange={setDraftLayout}
            onSelect={({ sectionId, itemId }) => {
              if (itemId) setSelection({ type: 'item', sectionId, itemId });
              else setSelection({ type: 'section', sectionId });
            }}
          />
        </aside>
        <main className="rounded border border-border p-3">
          <LivePreview form={previewForm} fields={fields} />
        </main>
        <aside className="space-y-4 rounded border border-border p-3">
          {selection.type === 'item' && selectedItem ? (
            <ItemPropertyEditor
              item={selectedItem}
              onChange={(patch) => updateItem(selection.sectionId, selection.itemId, patch)}
            />
          ) : null}
          {selection.type === 'section' && selectedSection ? (
            <SectionEditor
              section={selectedSection}
              onChange={(patch) => updateSection(selectedSection.id, patch)}
              onAddSection={addSection}
            />
          ) : null}
          {selection.type === 'rules' || (!selectedItem && !selectedSection) ? (
            <RulesPanel
              rules={draftLayout.rules ?? []}
              itemOptions={itemOptions}
              onChange={(rules) => setDraftLayout((prev) => ({ ...prev, rules }))}
            />
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={() => setSelection({ type: 'rules' })}>
            Edit form rules
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraftLayout((prev) => ({ ...prev, rules: [...(prev.rules ?? []), createRule()] }))}
          >
            Quick add rule
          </Button>
        </aside>
      </div>
    </div>
  );
}
