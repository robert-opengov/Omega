'use client';

import { forwardRef, type HTMLAttributes, type ReactNode, type ElementType } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, type AvatarProps, Separator } from '@/components/ui/atoms';

/* ------------------------------------------------------------------ */
/*  List                                                               */
/* ------------------------------------------------------------------ */

export interface ListProps extends HTMLAttributes<HTMLUListElement> {}

/**
 * A container for ListItem elements. Renders as `<ul>` with clean
 * CDS-37-aligned spacing.
 *
 * @example
 * <List>
 *   <ListItem><ListItemText primary="Item" /></ListItem>
 * </List>
 */
export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} role="listbox" className={cn('w-full', className)} {...props} />
  )
);
List.displayName = 'List';

/* ------------------------------------------------------------------ */
/*  ListItem                                                           */
/* ------------------------------------------------------------------ */

export interface ListItemProps extends HTMLAttributes<HTMLLIElement> {
  /** Marks this item as selected. */
  selected?: boolean;
  disabled?: boolean;
  /** Optional element rendered on the right side of the item. */
  secondaryAction?: ReactNode;
}

/**
 * A single row within a List. Supports selection, disabled states, and
 * an optional secondary action slot.
 *
 * @example
 * <ListItem selected onClick={() => {}}><ListItemText primary="Active" /></ListItem>
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({ selected, disabled, secondaryAction, className, children, onClick, ...props }, ref) => (
    <li
      ref={ref}
      role="option"
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      data-selected={selected || undefined}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200',
        onClick && !disabled && 'cursor-pointer hover:bg-action-hover-primary',
        selected && 'bg-action-hover-primary text-primary',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">{children}</div>
      {secondaryAction && <div className="shrink-0 ml-auto">{secondaryAction}</div>}
    </li>
  )
);
ListItem.displayName = 'ListItem';

/* ------------------------------------------------------------------ */
/*  ListItemIcon                                                       */
/* ------------------------------------------------------------------ */

export interface ListItemIconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ElementType;
}

/**
 * Renders a leading icon in a ListItem.
 */
export function ListItemIcon({ icon: Icon, className, ...props }: ListItemIconProps) {
  return (
    <span className={cn('flex items-center justify-center shrink-0 text-muted-foreground', className)} {...props}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  ListItemAvatar                                                     */
/* ------------------------------------------------------------------ */

export interface ListItemAvatarProps extends AvatarProps {}

/**
 * Renders an Avatar as the leading element in a ListItem.
 */
export function ListItemAvatar({ size = 'sm', ...props }: ListItemAvatarProps) {
  return <Avatar size={size} {...props} />;
}

/* ------------------------------------------------------------------ */
/*  ListItemText                                                       */
/* ------------------------------------------------------------------ */

export interface ListItemTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary text label. */
  primary: string;
  /** Optional secondary/description text. */
  secondary?: string;
}

/**
 * Renders primary and optional secondary text in a ListItem.
 */
export function ListItemText({ primary, secondary, className, ...props }: ListItemTextProps) {
  return (
    <div className={cn('min-w-0 flex-1', className)} {...props}>
      <p className="text-sm font-medium text-foreground truncate">{primary}</p>
      {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ListDivider                                                        */
/* ------------------------------------------------------------------ */

export interface ListDividerProps {
  /** When true, adds left padding to align with text after icons/avatars. */
  inset?: boolean;
  className?: string;
}

/**
 * A thin divider between ListItems, optionally inset to align with text.
 */
export function ListDivider({ inset, className }: ListDividerProps) {
  return (
    <li role="separator" className={cn(inset && 'pl-14', className)}>
      <Separator />
    </li>
  );
}
