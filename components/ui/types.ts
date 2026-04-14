import type { ElementType } from 'react';
import type { ButtonVariant } from '@/components/ui/atoms';

/**
 * Minimal action for dialog footers (Sheet, Modal).
 * Kept separate from ComponentAction because dialog actions use positional
 * slots (primary / secondary / destructive) rather than per-action variants.
 */
export interface DialogAction {
  label: string;
  onClick: () => void;
}

/**
 * Shared action interface used by molecules that render action buttons.
 * Variant is derived from Button's CVA variants (excluding 'link').
 */
export interface ComponentAction {
  label: string;
  onClick?: () => void;
  variant?: Exclude<ButtonVariant, 'link'>;
  icon?: ElementType;
}

/**
 * Semantic text color for value displays (amounts, metrics, etc.).
 * Maps to Tailwind text color classes via VALUE_COLOR_MAP.
 */
export type ValueColor = 'danger' | 'success' | 'warning' | 'muted' | 'primary';

export const VALUE_COLOR_MAP: Record<ValueColor, string> = {
  danger: 'text-danger-text',
  success: 'text-success-text',
  warning: 'text-warning-text',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
};
