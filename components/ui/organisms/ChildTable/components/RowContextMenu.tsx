'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RowActionId, RowActionItem } from '../core/models';

const ACTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  cut: Scissors,
  copy: Copy,
  paste: ClipboardPaste,
  insertAbove: Plus,
  insertBelow: Plus,
  clear: X,
  delete: Trash2,
};

export interface RowContextMenuProps {
  readonly items: RowActionItem[];
  readonly position: { x: number; y: number };
  readonly onAction: (id: RowActionId) => void;
  readonly onClose: () => void;
}

export function RowContextMenu({ items, position, onAction, onClose }: RowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  const actionItems = items
    .map((item, idx) => ({ item, idx }))
    .filter((entry): entry is { item: Extract<RowActionItem, { kind: 'action' }>; idx: number } => entry.item.kind === 'action');

  const focusItem = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, actionItems.length - 1));
      setFocusIndex(clamped);
      const el = menuRef.current?.querySelector<HTMLElement>(`[data-action-index="${clamped}"]`);
      el?.focus();
    },
    [actionItems.length],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [onClose]);

  useEffect(() => {
    focusItem(0);
  }, [focusItem]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(focusIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(focusIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        focusItem(actionItems.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const current = actionItems[focusIndex];
        if (current && !current.item.disabled) {
          onAction(current.item.id);
          onClose();
        }
        break;
      }
      case 'Tab':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const clampedStyle = {
    top: Math.min(position.y, typeof window !== 'undefined' ? window.innerHeight - 300 : position.y),
    left: Math.min(position.x, typeof window !== 'undefined' ? window.innerWidth - 220 : position.x),
  };

  let actionIndex = -1;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Row actions"
      onKeyDown={handleKeyDown}
      className="fixed z-[var(--z-popover,50)] min-w-[200px] max-w-[280px] rounded-lg border border-border bg-card shadow-overlay py-1 animate-in fade-in-0 zoom-in-95"
      style={clampedStyle}
    >
      {items.map((item, i) => {
        if (item.kind === 'title') {
          return (
            <div
              key={`title-${i}`}
              className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-[0.5px] select-none"
            >
              {item.label}
            </div>
          );
        }

        if (item.kind === 'divider') {
          return (
            <div key={`div-${i}`} role="separator" className="my-1 h-px bg-border" />
          );
        }

        actionIndex++;
        const currentActionIdx = actionIndex;
        const Icon = ACTION_ICONS[item.id];

        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            data-action-index={currentActionIdx}
            aria-disabled={item.disabled ? 'true' : undefined}
            tabIndex={currentActionIdx === focusIndex ? 0 : -1}
            onClick={() => {
              if (!item.disabled) {
                onAction(item.id);
                onClose();
              }
            }}
            className={cn(
              'flex w-full items-center gap-2.5 px-4 py-2 text-sm text-left whitespace-nowrap transition-colors duration-150',
              'focus-visible:outline-none focus:outline-2 focus:outline-primary focus:-outline-offset-2 focus:bg-primary/5',
              item.danger && !item.disabled && 'text-destructive hover:bg-destructive/5',
              !item.danger && !item.disabled && 'text-foreground hover:bg-muted',
              item.disabled && 'opacity-40 cursor-not-allowed',
            )}
          >
            {Icon && (
              <Icon className={cn(
                'h-3.5 w-3.5 shrink-0',
                item.danger ? 'text-destructive' : 'text-muted-foreground',
              )} />
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default RowContextMenu;
