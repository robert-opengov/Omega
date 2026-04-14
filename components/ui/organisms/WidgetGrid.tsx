'use client';

import { useMemo, useState, Children, isValidElement, useCallback, type ReactNode } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Button, Switch } from '@/components/ui/atoms';
import { Sheet } from '@/components/ui/molecules/Sheet';
import { ResponsiveGrid, type ResponsiveGridColumns } from '@/components/ui/molecules/ResponsiveGrid';
import { Settings, GripVertical } from 'lucide-react';

export interface WidgetConfig {
  id: string;
  visible?: boolean;
  order?: number;
}

export interface WidgetGridProps {
  children: ReactNode;
  config?: WidgetConfig[];
  columns?: ResponsiveGridColumns;
  gap?: 'sm' | 'md' | 'lg';
  onConfigChange?: (config: WidgetConfig[]) => void;
  customizable?: boolean;
  className?: string;
}

/**
 * Dashboard widget grid with optional customization sheet for
 * reordering/toggling widget visibility. Children must have a
 * `data-widget-id` attribute or a unique `key` for identification.
 *
 * @example
 * <WidgetGrid customizable config={widgetConfig} onConfigChange={setConfig}>
 *   <MetricCard data-widget-id="revenue" ... />
 *   <ChartWidget data-widget-id="chart" ... />
 * </WidgetGrid>
 */
export function WidgetGrid({
  children,
  config,
  columns = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
  onConfigChange,
  customizable = false,
  className,
}: WidgetGridProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const childArray = useMemo(() => {
    const result: { id: string; element: ReactNode }[] = [];
    Children.forEach(children, (child, index) => {
      if (!isValidElement(child)) return;
      const widgetId = (child.props as Record<string, unknown>)?.['data-widget-id'] as string
        ?? child.key?.toString()
        ?? `widget-${index}`;
      result.push({ id: widgetId, element: child });
    });
    return result;
  }, [children]);

  const normalizedConfig = useMemo(() => {
    if (!config) return childArray.map((c, i) => ({ id: c.id, visible: true, order: i }));
    const configMap = new Map(config.map((c) => [c.id, c]));
    return childArray
      .map((c, i) => ({
        id: c.id,
        visible: configMap.get(c.id)?.visible ?? true,
        order: configMap.get(c.id)?.order ?? i,
      }))
      .sort((a, b) => a.order - b.order);
  }, [config, childArray]);

  const visibleChildren = useMemo(() => {
    const childMap = new Map(childArray.map((c) => [c.id, c.element]));
    return normalizedConfig
      .filter((c) => c.visible)
      .map((c) => childMap.get(c.id))
      .filter(Boolean);
  }, [normalizedConfig, childArray]);

  const handleReorder = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = [...normalizedConfig];
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);

    const newConfig = items.map((item, index) => ({ ...item, order: index }));
    onConfigChange?.(newConfig);
  }, [normalizedConfig, onConfigChange]);

  const handleToggleVisibility = useCallback((id: string) => {
    const newConfig = normalizedConfig.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c,
    );
    onConfigChange?.(newConfig);
  }, [normalizedConfig, onConfigChange]);

  const getWidgetLabel = (id: string): string => {
    const child = childArray.find((c) => c.id === id);
    if (child && isValidElement(child.element)) {
      const props = child.element.props as Record<string, unknown>;
      if (typeof props?.title === 'string') return props.title;
      if (typeof props?.['aria-label'] === 'string') return props['aria-label'] as string;
    }
    return id;
  };

  return (
    <div className={className}>
      {customizable && (
        <div className="flex justify-end mb-3">
          <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
            <Settings className="h-4 w-4 mr-1.5" />
            Customize
          </Button>
        </div>
      )}

      <ResponsiveGrid columns={columns} gap={gap}>
        {visibleChildren}
      </ResponsiveGrid>

      {customizable && (
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Customize Dashboard"
          description="Drag to reorder and toggle widget visibility."
          size="sm"
        >
          <DragDropContext onDragEnd={handleReorder}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {normalizedConfig.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(
                            'flex items-center gap-3 rounded border border-border bg-card px-3 py-2 transition-shadow',
                            dragSnapshot.isDragging && 'shadow-lg',
                          )}
                        >
                          <div {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </div>
                          <span className="flex-1 text-sm text-foreground truncate">
                            {getWidgetLabel(item.id)}
                          </span>
                          <Switch
                            checked={item.visible}
                            onCheckedChange={() => handleToggleVisibility(item.id)}
                            aria-label={`Toggle ${getWidgetLabel(item.id)}`}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Sheet>
      )}
    </div>
  );
}

export default WidgetGrid;
