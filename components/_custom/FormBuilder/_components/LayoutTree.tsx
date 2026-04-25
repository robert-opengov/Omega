'use client';

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/atoms';
import { GripVertical } from 'lucide-react';
import type { FormLayout, FormLayoutItem } from '@/lib/core/ports/form.repository';

interface LayoutTreeProps {
  layout: FormLayout;
  onChange: (layout: FormLayout) => void;
  onSelect: (selection: { sectionId: string; itemId?: string }) => void;
}

export function reorderItems(
  items: FormLayoutItem[],
  activeId: string,
  overId: string,
): FormLayoutItem[] {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  return arrayMove(items, from, to);
}

export function LayoutTree({ layout, onChange, onSelect }: Readonly<LayoutTreeProps>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    onChange({
      ...layout,
      sections: layout.sections.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: reorderItems(section.items, String(active.id), String(over.id)),
            },
      ),
    });
  };

  return (
    <div className="space-y-3">
      {layout.sections.map((section) => (
        <div key={section.id} className="rounded border border-border p-2">
          <button
            type="button"
            className="w-full text-left text-sm font-semibold text-foreground"
            onClick={() => onSelect({ sectionId: section.id })}
          >
            {section.title || 'Untitled section'}
          </button>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(section.id)}>
            <SortableContext items={section.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <LayoutRow
                    key={item.id}
                    id={item.id}
                    label={`${item.type}${item.type === 'field' ? ` • ${item.fieldId}` : ''}`}
                    onSelect={() => onSelect({ sectionId: section.id, itemId: item.id })}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      ))}
    </div>
  );
}

function LayoutRow({
  id,
  label,
  onSelect,
}: Readonly<{ id: string; label: string; onSelect: () => void }>) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li ref={setNodeRef} style={style}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={onSelect}
      >
        <span {...attributes} {...listeners} aria-label="Drag handle">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </span>
        <span>{label}</span>
      </Button>
    </li>
  );
}
