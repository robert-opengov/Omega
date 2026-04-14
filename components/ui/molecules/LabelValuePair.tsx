'use client';

import { type HTMLAttributes, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Text, Chip, type ChipProps } from '@/components/ui/atoms';

export interface LabelValuePairProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Descriptive label. */
  label: string;
  /** Display value — rendered as text or inside a Chip when `asChip` is true. */
  value: ReactNode;
  /** When true, renders the value inside a Chip component. */
  asChip?: boolean;
  /** Props forwarded to the Chip when `asChip` is true. */
  chipProps?: Partial<ChipProps>;
  /** When true, stacks label above value; otherwise displays side-by-side. */
  stacked?: boolean;
  /** Optional leading icon for the label. */
  icon?: ElementType;
}

/**
 * Displays a label alongside its value — a common pattern in detail
 * views, sidebars, and data summaries.
 *
 * @example
 * <LabelValuePair label="Status" value="Active" asChip chipProps={{ color: 'success' }} />
 *
 * @example
 * <LabelValuePair label="Department" value="Engineering" stacked />
 */
export function LabelValuePair({
  label,
  value,
  asChip,
  chipProps,
  stacked,
  icon: Icon,
  className,
  ...props
}: LabelValuePairProps) {
  return (
    <div
      className={cn(
        'flex gap-1.5',
        stacked ? 'flex-col' : 'flex-row items-center',
        className
      )}
      {...props}
    >
      <Text
        size="sm"
        color="muted"
        weight="medium"
        className="flex items-center gap-1.5 shrink-0"
      >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Text>

      {asChip ? (
        <Chip label={typeof value === 'string' ? value : String(value)} size="sm" {...chipProps} />
      ) : (
        <Text size="sm" weight="semibold" color="foreground">
          {value}
        </Text>
      )}
    </div>
  );
}

export default LabelValuePair;
