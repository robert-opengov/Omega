'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Button, Heading, Text } from '@/components/ui/atoms';
import { Card, CardContent, PageHeader, Alert, ConfirmDialog } from '@/components/ui/molecules';
import { GripVertical, Save, Trash2, Monitor, Tablet, Smartphone } from 'lucide-react';
import type { GabPage, PageComponent, PageLayout, PageRow } from '@/lib/core/ports/pages.repository';
import {
  createBlockInstance,
  emptyPageLayout,
  findComponent,
  normalizePageLayout,
  withAddedRow,
  withAppendedBlock,
  withDeletedComponent,
  withDeletedRow,
  withMovedComponent,
  withReorderedComponents,
  withUpdatedComponent,
  withUpdatedRow,
} from '@/lib/page-builder/layout-helpers';
import { updatePageAction } from '@/app/actions/pages';
import { PageRenderer } from './PageRenderer';
import { PalettePanel } from './editor/PalettePanel';
import { PropertiesPanel } from './editor/PropertiesPanel';
import { RowToolbar } from './editor/RowToolbar';
import { PageRuntimeProviders } from './runtime/PageContexts';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { PageComponentDefinition } from '@/lib/page-builder/page-component-registry';
import { registerCustomComponents } from '@/lib/page-builder/register-custom';
import { useHistory } from '@/lib/page-builder/use-history';
import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';
import { Undo2, Redo2 } from 'lucide-react';

export interface PageEditorClientProps {
  appId: string;
  page: GabPage;
  /**
   * If true, the underlying app's schema is locked (e.g. sandbox-only mode).
   * The editor is shown read-only and Save is disabled.
   */
  schemaLocked?: boolean;
  /**
   * App-scoped custom components to register into the palette. Loaded server-side
   * by the page route so the editor renders with them already available.
   */
  customComponents?: GabCustomComponent[];
}

export function PageEditorClient({
  appId,
  page,
  schemaLocked = false,
  customComponents,
}: PageEditorClientProps) {
  // Register custom components into the singleton registry so the palette and
  // renderer pick them up. Re-runs when the component list changes (e.g. after
  // a save in another tab triggers `router.refresh()`).
  const customSig = JSON.stringify(customComponents ?? []);
  useEffect(() => {
    registerCustomComponents(customComponents ?? []);
  }, [customSig, customComponents]);
  const router = useRouter();
  const history = useHistory<PageLayout>(emptyPageLayout());
  const layout = history.state;
  const setLayout = history.set;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [preview, setPreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PageComponent | null>(null);

  const pageLayoutSig = JSON.stringify(page.layout);
  useEffect(() => {
    // `reset` clears history when the persisted layout changes (initial mount,
    // after a save reload, or a server refresh) so undo can't roll us back
    // past the last server-known good state.
    history.reset(normalizePageLayout(page.layout));
    // history.reset is stable; intentionally exclude from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLayoutSig, page.layout]);

  // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z (or Ctrl on Windows).
  useEffect(() => {
    if (schemaLocked) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Ignore when typing in editable fields.
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        history.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history, schemaLocked]);

  const selectedInfo = useMemo(
    () => (selectedId ? findComponent(layout, selectedId) : null),
    [layout, selectedId],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleAddBlock = (def: PageComponentDefinition, rowId?: string) => {
    if (schemaLocked) return;
    const comp = createBlockInstance(def.type);
    setLayout((prev) => withAppendedBlock(prev, comp, rowId));
    setSelectedId(comp.id);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromInfo = findComponent(layout, String(active.id));
    if (!fromInfo) return;

    // Dropping on a row container (id starts with 'row:')
    const overId = String(over.id);
    if (overId.startsWith('row:')) {
      const toRowId = overId.slice(4);
      setLayout((prev) =>
        withMovedComponent(prev, String(active.id), toRowId, Number.MAX_SAFE_INTEGER),
      );
      return;
    }
    // Dropping on another component — reorder within row, or move across rows.
    const toInfo = findComponent(layout, overId);
    if (!toInfo) return;

    if (fromInfo.rowId === toInfo.rowId) {
      setLayout((prev) =>
        withReorderedComponents(prev, fromInfo.rowId, fromInfo.index, toInfo.index),
      );
    } else {
      setLayout((prev) =>
        withMovedComponent(prev, String(active.id), toInfo.rowId, toInfo.index),
      );
    }
  };

  const save = async () => {
    if (schemaLocked) return;
    setSaving(true);
    setSaveError(null);
    const res = await updatePageAction(appId, page.key, { layout });
    setSaving(false);
    if (res.success) router.refresh();
    else setSaveError(res.error ?? 'Save failed');
  };

  const onDelete = useCallback(
    (id: string) => {
      setLayout((prev) => withDeletedComponent(prev, id));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId],
  );

  const askDelete = (c: PageComponent) => {
    setDeleteTarget(c);
    setDeleteOpen(true);
  };

  const canvasMax =
    preview === 'tablet'
      ? 'max-w-[768px]'
      : preview === 'mobile'
        ? 'max-w-[400px]'
        : 'max-w-full';

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={page.name}
        description={page.slug}
        className="border-0 p-0"
      />

      {schemaLocked && (
        <Alert variant="warning" title="Schema locked">
          This app&apos;s schema is locked (sandbox mode). The page is shown
          read-only. Promote the sandbox to production to edit pages here.
        </Alert>
      )}

      <Toolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        preview={preview}
        setPreview={setPreview}
        onSave={save}
        saving={saving}
        disabled={schemaLocked}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={history.undo}
        onRedo={history.redo}
      />

      {saveError && (
        <Alert variant="error" title="Save failed" onDismiss={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {viewMode === 'edit' && !schemaLocked && (
          <Card className="lg:col-span-3 order-2 lg:order-1">
            <CardContent className="p-3">
              <PalettePanel onAdd={(def) => handleAddBlock(def, selectedInfo?.rowId)} />
            </CardContent>
          </Card>
        )}

        <div
          className={cn(
            'lg:col-span-6 order-1',
            viewMode === 'edit' && 'space-y-3',
            canvasMax,
            'mx-auto w-full',
          )}
        >
          {viewMode === 'preview' ? (
            <Card className="p-4">
              <PageRenderer layout={layout} appId={appId} />
            </Card>
          ) : (
            <PageRuntimeProviders>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div
                  className="space-y-3 min-h-[200px] border border-dashed border-border rounded-lg p-3"
                  onClick={() => setSelectedId(null)}
                >
                  {layout.rows.map((row, rowIndex) => (
                    <div key={row.id} onClick={(e) => e.stopPropagation()}>
                      <RowToolbar
                        row={row}
                        index={rowIndex}
                        rowCount={layout.rows.length}
                        onUpdate={(patch) => setLayout((prev) => withUpdatedRow(prev, row.id, patch))}
                        onDelete={() => setLayout((prev) => withDeletedRow(prev, row.id))}
                        onAddRowBelow={() =>
                          setLayout((prev) => withAddedRow(prev, row.columns, rowIndex + 1))
                        }
                      />
                      <RowCanvas
                        row={row}
                        appId={appId}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDelete={askDelete}
                      />
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setLayout((prev) => withAddedRow(prev, 1))}
                    >
                      Add row
                    </Button>
                  </div>
                </div>
              </DndContext>
            </PageRuntimeProviders>
          )}
        </div>

        {viewMode === 'edit' && !schemaLocked && (
          <Card className="lg:col-span-3 order-3">
            <CardContent className="p-3">
              {selectedInfo ? (
                <PropertiesPanel
                  appId={appId}
                  component={selectedInfo.component}
                  row={layout.rows.find((r) => r.id === selectedInfo.rowId)!}
                  onUpdateProps={(next) =>
                    setLayout((prev) => withUpdatedComponent(prev, selectedInfo.component.id, { props: next }))
                  }
                  onUpdateBinding={(next) =>
                    setLayout((prev) =>
                      withUpdatedComponent(prev, selectedInfo.component.id, { dataBinding: next }),
                    )
                  }
                  onUpdateLayout={(patch) =>
                    setLayout((prev) => withUpdatedComponent(prev, selectedInfo.component.id, patch))
                  }
                  onUpdateStyle={(style) =>
                    setLayout((prev) => withUpdatedComponent(prev, selectedInfo.component.id, { style }))
                  }
                />
              ) : (
                <Text size="sm" color="muted">
                  Select a block to edit its properties.
                </Text>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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

// ─── Toolbar ───────────────────────────────────────────────────────────────

function Toolbar({
  viewMode,
  setViewMode,
  preview,
  setPreview,
  onSave,
  saving,
  disabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  viewMode: 'edit' | 'preview';
  setViewMode: (m: 'edit' | 'preview') => void;
  preview: 'desktop' | 'tablet' | 'mobile';
  setPreview: (p: 'desktop' | 'tablet' | 'mobile') => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
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
      <div className="flex border border-border rounded-md overflow-hidden">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-none h-8 w-8 p-0"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          title="Undo (⌘Z)"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-none h-8 w-8 p-0"
          onClick={onRedo}
          disabled={!canRedo || disabled}
          title="Redo (⌘⇧Z)"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
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
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={saving || disabled}
          loading={saving}
          icon={Save}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

// ─── Canvas pieces ─────────────────────────────────────────────────────────

function RowCanvas({
  row,
  appId,
  selectedId,
  onSelect,
  onDelete,
}: {
  row: PageRow;
  appId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (c: PageComponent) => void;
}) {
  const cols = row.columns ?? 1;
  const colsMd = row.columnsMd ?? cols;
  const colsSm = row.columnsSm ?? 1;
  const gap = row.gap ?? 16;

  if (row.components.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded">
        Empty row — drop a block here from the palette
      </div>
    );
  }

  return (
    <SortableContext
      id={`row:${row.id}`}
      items={row.components.map((c) => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        data-row-canvas={row.id}
        className="grid w-full"
        style={{
          gap,
          gridTemplateColumns: `repeat(${colsSm}, minmax(0, 1fr))`,
        }}
      >
        <style>{`@media(min-width:768px){[data-row-canvas="${row.id}"]{grid-template-columns:repeat(${colsMd}, minmax(0, 1fr));}}@media(min-width:1024px){[data-row-canvas="${row.id}"]{grid-template-columns:repeat(${cols}, minmax(0, 1fr));}}`}</style>
        {row.components.map((c) => (
          <SortableEditorBlock
            key={c.id}
            id={c.id}
            row={row}
            appId={appId}
            comp={c}
            selected={selectedId === c.id}
            onSelect={() => onSelect(c.id)}
            onDelete={() => onDelete(c)}
          />
        ))}
      </div>
    </SortableContext>
  );
}

function SortableEditorBlock({
  id,
  row,
  appId,
  comp,
  selected,
  onSelect,
  onDelete,
}: {
  id: string;
  row: PageRow;
  appId: string;
  comp: PageComponent;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const span = comp.colSpan ?? row.columns;
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        gridColumn: `span ${Math.min(span, row.columns)}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'relative rounded border bg-card group',
        selected
          ? 'border-primary ring-1 ring-primary'
          : 'border-border hover:border-muted-foreground/30',
      )}
      data-block-id={id}
    >
      <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
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
      <div className="p-3 pr-12 pointer-events-none">
        <PageRenderer
          layout={{ type: 'grid', rows: [{ id: 'r-prev', columns: 1, components: [comp] }] }}
          appId={appId}
          withProviders={false}
        />
      </div>
    </div>
  );
}
