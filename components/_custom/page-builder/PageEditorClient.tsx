'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Heading, Text, Textarea, Label } from '@/components/ui/atoms';
import { Card, CardContent, PageHeader, Alert, Modal, ConfirmDialog } from '@/components/ui/molecules';
import { GripVertical, Plus, Save, Trash2, Sparkles, Monitor, Tablet, Smartphone } from 'lucide-react';
import type { GabPage, PageComponent, PageLayout } from '@/lib/core/ports/pages.repository';
import {
  SHOWCASE_BLOCK_MANIFEST,
  getBlockManifestOrThrow,
  type ShowcaseBlockManifestEntry,
} from '@/lib/page-builder/showcase-block-manifest';
import {
  collapseLayoutToOneRow,
  createBlockInstance,
  emptyPageLayout,
  getComponentsFlat,
  normalizePageLayout,
  withAppendedBlock,
  withDeletedComponent,
  withReorderedComponents,
  withUpdatedComponent,
} from '@/lib/page-builder/layout-helpers';
import { updatePageAction } from '@/app/actions/pages';
import { PageRenderer } from './PageRenderer';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function SortableEditorBlock({
  id,
  appId,
  comp,
  selected,
  onSelect,
  onDelete,
  label,
}: {
  id: string;
  appId: string;
  comp: PageComponent;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  label: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'relative rounded border bg-card p-0 min-h-[40px]',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30',
      )}
    >
      <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 [div:hover>&]:opacity-100">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-7 cursor-grab p-0"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-7 text-destructive p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {selected && (
        <span className="absolute -top-2.5 left-2 text-[10px] font-semibold uppercase bg-primary text-primary-foreground px-1 rounded z-[5]">
          {label}
        </span>
      )}
      <div className="p-3 pr-12 pointer-events-none">
        <PageRenderer layout={{ type: 'grid', rows: [{ id: 'p', columns: 1, components: [comp] }] }} appId={appId} />
      </div>
    </div>
  );
}

const tiers: { id: 'atom' | 'molecule' | 'organism'; label: string }[] = [
  { id: 'atom', label: 'Atoms' },
  { id: 'molecule', label: 'Molecules' },
  { id: 'organism', label: 'Organisms' },
];

function propsToJsonString(props: Record<string, unknown>) {
  try {
    return JSON.stringify(props, null, 2);
  } catch {
    return '{}';
  }
}

export interface PageEditorClientProps {
  appId: string;
  page: GabPage;
}

export function PageEditorClient({ appId, page }: PageEditorClientProps) {
  const router = useRouter();
  const [layout, setLayout] = useState<PageLayout>(emptyPageLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [preview, setPreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'atom' | 'molecule' | 'organism'>('all');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PageComponent | null>(null);

  const pageLayoutSig = JSON.stringify(page.layout);
  useEffect(() => {
    setLayout(collapseLayoutToOneRow(normalizePageLayout(page.layout)));
  }, [pageLayoutSig, page.layout]);

  const components = getComponentsFlat(layout);
  const selected = components.find((c) => c.id === selectedId) ?? null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const flat = getComponentsFlat(layout);
    const oldIndex = flat.findIndex((c) => c.id === active.id);
    const newIndex = flat.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setLayout(withReorderedComponents(layout, oldIndex, newIndex));
  };

  const addBlock = (entry: ShowcaseBlockManifestEntry) => {
    const comp = createBlockInstance(entry.id);
    setLayout((prev) => withAppendedBlock(collapseLayoutToOneRow(prev), comp));
    setSelectedId(comp.id);
  };

  const updateSelectedProps = (json: string) => {
    if (!selectedId) return;
    try {
      const next = JSON.parse(json) as Record<string, unknown>;
      setLayout((prev) => withUpdatedComponent(prev, selectedId, { props: next }));
    } catch {
      /* keep */
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const res = await updatePageAction(appId, page.key, { layout: collapseLayoutToOneRow(layout) });
    setSaving(false);
    if (res.success) {
      router.refresh();
    } else {
      setSaveError(res.error ?? 'Save failed');
    }
  };

  const onDelete = useCallback(
    (id: string) => {
      setLayout((prev) => {
        const next = withDeletedComponent(collapseLayoutToOneRow(prev), id);
        return getComponentsFlat(next).length ? next : emptyPageLayout();
      });
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId],
  );

  const askDelete = (c: PageComponent) => {
    setDeleteTarget(c);
    setDeleteOpen(true);
  };

  const filteredBlocks =
    paletteFilter === 'all'
      ? SHOWCASE_BLOCK_MANIFEST
      : SHOWCASE_BLOCK_MANIFEST.filter((b) => b.tier === paletteFilter);

  const canvasMax =
    preview === 'tablet' ? 'max-w-[768px]' : preview === 'mobile' ? 'max-w-[400px]' : 'max-w-full';

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={page.name}
        description={page.slug}
        className="border-0 p-0"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={viewMode === 'edit' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('edit')}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant={viewMode === 'preview' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('preview')}
        >
          Preview
        </Button>
        {viewMode === 'preview' && (
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button
              type="button"
              size="sm"
              variant={preview === 'desktop' ? 'secondary' : 'ghost'}
              onClick={() => setPreview('desktop')}
              className="rounded-none h-8 w-8 p-0"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preview === 'tablet' ? 'secondary' : 'ghost'}
              onClick={() => setPreview('tablet')}
              className="rounded-none h-8 w-8 p-0"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preview === 'mobile' ? 'secondary' : 'ghost'}
              onClick={() => setPreview('mobile')}
              className="rounded-none h-8 w-8 p-0"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAiOpen(true)} icon={Sparkles}>
            AI
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={saving}
            loading={saving}
            icon={Save}
          >
            Save
          </Button>
        </div>
      </div>

      {saveError && <Alert variant="error" title="Save failed" onDismiss={() => setSaveError(null)}>{saveError}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {viewMode === 'edit' && (
          <Card className="lg:col-span-3 order-2 lg:order-1">
            <CardContent className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={paletteFilter === 'all' ? 'secondary' : 'outline'}
                  onClick={() => setPaletteFilter('all')}
                >
                  All
                </Button>
                {tiers.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    size="sm"
                    variant={paletteFilter === t.id ? 'secondary' : 'outline'}
                    onClick={() => setPaletteFilter(t.id)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              <Text size="xs" color="muted" className="block">
                From UI Showcase — same block set as /ui
              </Text>
              <div className="flex flex-col gap-1">
                {filteredBlocks.map((b) => (
                  <Button
                    key={b.id}
                    type="button"
                    variant="outline"
                    className="justify-start text-left h-auto py-1.5"
                    onClick={() => addBlock(b)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1 shrink-0" />
                    <span className="text-xs">
                      {b.label}
                      <span className="ml-1 text-[10px] text-muted-foreground">({b.tier})</span>
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div
          className={cn('lg:col-span-6 order-1', viewMode === 'edit' && 'space-y-3', canvasMax, 'mx-auto w-full')}
        >
          {viewMode === 'preview' ? (
            <Card className="p-4">
              <PageRenderer layout={collapseLayoutToOneRow(layout)} appId={appId} />
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={components.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="space-y-2 min-h-[200px] border border-dashed border-border rounded-lg p-3"
                  onClick={() => setSelectedId(null)}
                >
                  {components.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Add components from the palette
                    </p>
                  )}
                  {components.map((c) => {
                    let label = c.type;
                    try {
                      label = getBlockManifestOrThrow(c.type).label;
                    } catch { /* custom */ }
                    return (
                      <div key={c.id} className="group" onClick={(e) => e.stopPropagation()}>
                        <SortableEditorBlock
                          id={c.id}
                          appId={appId}
                          comp={c}
                          label={label}
                          selected={selectedId === c.id}
                          onSelect={() => setSelectedId(c.id)}
                          onDelete={() => askDelete(c)}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {viewMode === 'edit' && (
          <Card className="lg:col-span-3 order-3">
            <CardContent className="p-3 space-y-2">
              <Heading as="h3" className="text-sm font-semibold">
                Properties
              </Heading>
              {selected ? (
                <>
                  <Text size="xs" color="muted">
                    {selected.type}
                  </Text>
                  <Label htmlFor="prop-json" className="text-xs">
                    Props (JSON)
                  </Label>
                  <Textarea
                    id="prop-json"
                    value={propsToJsonString(selected.props)}
                    onChange={(e) => updateSelectedProps(e.target.value)}
                    className="font-mono text-xs min-h-[200px]"
                  />
                </>
              ) : (
                <Text size="sm" color="muted">
                  Select a block
                </Text>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal open={aiOpen} onOpenChange={setAiOpen} title="AI (props assistant)" className="max-w-lg">
        <Text size="sm" color="muted" className="mb-2">
          Describe a change. A future version can call the AI gateway to suggest JSON prop patches. For now, use
          the JSON editor in Properties.
        </Text>
        <Textarea
          value={aiNote}
          onChange={(e) => setAiNote(e.target.value)}
          placeholder="E.g. Make the hero title &quot;Permits&quot; and subtitle &quot;Track applications&quot;…"
          className="min-h-[100px]"
        />
        <div className="mt-2 flex justify-end">
          <Button type="button" onClick={() => setAiOpen(false)} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove block?"
        description="This block will be removed from the page layout. Save to persist."
        confirmLabel="Remove"
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
