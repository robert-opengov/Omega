'use client';

import { useCallback, type ReactNode } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Avatar, Badge } from '@/components/ui/atoms';
import { Card, CardContent } from '@/components/ui/molecules/Card';

export interface KanbanItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  avatar?: { src?: string; fallback?: ReactNode };
  badge?: { label: string; variant?: string };
  metadata?: ReactNode;
}

export interface KanbanColumn {
  id: string;
  title: ReactNode;
  items: KanbanItem[];
  color?: string;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onItemMove?: (itemId: string, fromColumn: string, toColumn: string, newIndex: number) => void;
  onItemClick?: (item: KanbanItem, columnId: string) => void;
  renderItem?: (item: KanbanItem, columnId: string) => ReactNode;
  renderColumnHeader?: (column: KanbanColumn) => ReactNode;
  draggable?: boolean;
  className?: string;
  ariaLabel?: string;
}

function DefaultCard({
  item,
  onClick,
}: {
  item: KanbanItem;
  onClick?: () => void;
}) {
  return (
    <Card
      className={cn('cursor-pointer hover:shadow-sm transition-shadow', onClick && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring')}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? 'button' : undefined}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
          {item.badge && (
            <Badge variant="default" size="sm" className="shrink-0">
              {item.badge.label}
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          {item.avatar && (
            <Avatar
              src={item.avatar.src}
              fallback={typeof item.avatar.fallback === 'string' ? item.avatar.fallback : '?'}
              size="sm"
            />
          )}
          {item.metadata && (
            <div className="text-xs text-muted-foreground ml-auto">{item.metadata}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Kanban board with draggable cards across columns.
 * Uses `@hello-pangea/dnd` for accessible drag-and-drop.
 *
 * @example
 * <KanbanBoard
 *   columns={[
 *     { id: 'todo', title: 'To Do', items: [...] },
 *     { id: 'doing', title: 'In Progress', items: [...] },
 *     { id: 'done', title: 'Done', items: [...] },
 *   ]}
 *   onItemMove={(itemId, from, to, index) => handleMove(...)}
 * />
 */
export function KanbanBoard({
  columns,
  onItemMove,
  onItemClick,
  renderItem,
  renderColumnHeader,
  draggable = true,
  className,
  ariaLabel = 'Kanban board',
}: KanbanBoardProps) {
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    onItemMove?.(draggableId, source.droppableId, destination.droppableId, destination.index);
  }, [onItemMove]);

  const board = (
    <div
      className={cn('flex gap-4 overflow-x-auto pb-2', className)}
      role="region"
      aria-label={ariaLabel}
    >
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col min-w-[280px] max-w-[320px] w-[280px] shrink-0">
          {/* Column Header */}
          {renderColumnHeader ? renderColumnHeader(column) : (
            <div className="flex items-center gap-2 mb-3 px-1">
              {column.color && (
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: column.color }} aria-hidden="true" />
              )}
              <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 ml-auto">
                {column.items.length}
              </span>
            </div>
          )}

          {/* Droppable Column */}
          {draggable ? (
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex-1 rounded-lg border border-dashed border-border p-2 space-y-2 transition-colors min-h-[100px]',
                    snapshot.isDraggingOver && 'border-primary bg-primary-light/50',
                  )}
                >
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={cn(dragSnapshot.isDragging && 'opacity-90 shadow-lg rotate-[1deg]')}
                        >
                          {renderItem
                            ? renderItem(item, column.id)
                            : <DefaultCard item={item} onClick={onItemClick ? () => onItemClick(item, column.id) : undefined} />
                          }
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <div className="flex-1 rounded-lg border border-dashed border-border p-2 space-y-2 min-h-[100px]">
              {column.items.map((item) => (
                <div key={item.id}>
                  {renderItem
                    ? renderItem(item, column.id)
                    : <DefaultCard item={item} onClick={onItemClick ? () => onItemClick(item, column.id) : undefined} />
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (!draggable) return board;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {board}
    </DragDropContext>
  );
}

export default KanbanBoard;
