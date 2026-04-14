'use client';

import { useId, useCallback, type ElementType, type ReactNode, type KeyboardEvent } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export interface CategoryItem {
  id: string;
  icon?: ElementType;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

const categoryCardVariants = cva(
  'relative flex flex-col items-center text-center rounded border-2 transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    variants: {
      size: {
        sm: 'p-3 gap-1.5',
        md: 'p-4 gap-2',
        lg: 'p-6 gap-3',
      },
      selected: {
        true: 'border-primary bg-primary-light shadow-sm',
        false: 'border-border bg-card hover:border-primary/50 hover:shadow-sm',
      },
      isDisabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: { size: 'md', selected: false, isDisabled: false },
  },
);

const iconSizeMap = { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-8 w-8' };

export interface CategoryGridProps {
  items: CategoryItem[];
  selected?: string;
  onSelect?: (id: string) => void;
  columns?: { default?: number; sm?: number; lg?: number };
  size?: VariantProps<typeof categoryCardVariants>['size'];
  className?: string;
}

/**
 * Selectable card grid for choosing a category or option.
 * Uses `role="radiogroup"` / `role="radio"` with keyboard arrow navigation.
 */
export function CategoryGrid({
  items,
  selected,
  onSelect,
  columns = { default: 1, sm: 2, lg: 3 },
  size = 'md',
  className,
}: CategoryGridProps) {
  const groupId = useId();
  const resolvedSize = size ?? 'md';

  const handleKeyDown = useCallback((e: KeyboardEvent, currentIndex: number) => {
    const enabledItems = items.filter((i) => !i.disabled);
    const currentEnabledIndex = enabledItems.findIndex((i) => i.id === items[currentIndex]?.id);
    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length;
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (!items[currentIndex]?.disabled) {
          onSelect?.(items[currentIndex].id);
        }
        return;
      default:
        return;
    }

    if (nextIndex >= 0) {
      const nextItem = enabledItems[nextIndex];
      onSelect?.(nextItem.id);
      const el = document.getElementById(`${groupId}-${nextItem.id}`);
      el?.focus();
    }
  }, [items, groupId, onSelect]);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns.default ?? 1}, minmax(0, 1fr))`,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media(min-width:640px){.cg-${groupId.replace(/:/g, '')}{grid-template-columns:repeat(${columns.sm ?? columns.default ?? 1},minmax(0,1fr))}}
        @media(min-width:1024px){.cg-${groupId.replace(/:/g, '')}{grid-template-columns:repeat(${columns.lg ?? columns.sm ?? columns.default ?? 1},minmax(0,1fr))}}
      ` }} />
      <div
        role="radiogroup"
        aria-label="Select a category"
        className={cn('grid gap-3', `cg-${groupId.replace(/:/g, '')}`, className)}
        style={gridStyle}
      >
        {items.map((item, index) => {
          const isSelected = item.id === selected;
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              id={`${groupId}-${item.id}`}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={item.disabled || undefined}
              tabIndex={isSelected || (!selected && index === 0) ? 0 : -1}
              onClick={() => !item.disabled && onSelect?.(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={categoryCardVariants({ size, selected: isSelected, isDisabled: !!item.disabled })}
            >
              {Icon && <Icon className={cn(iconSizeMap[resolvedSize], isSelected ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />}
              <span className={cn('font-medium', resolvedSize === 'lg' ? 'text-base' : 'text-sm')}>{item.label}</span>
              {item.description && (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default CategoryGrid;
