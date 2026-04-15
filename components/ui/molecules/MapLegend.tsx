'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { statusDotVariants } from '@/components/ui/atoms';
import type { StatusDotProps } from '@/components/ui/atoms';

const mapLegendVariants = cva(
  'z-content bg-card/95 backdrop-blur-sm border border-border rounded shadow-sm px-3 py-2',
  {
    variants: {
      position: {
        'bottom-left': 'absolute bottom-3 left-3',
        'bottom-right': 'absolute bottom-3 right-3',
        'top-left': 'absolute top-3 left-3',
        'top-right': 'absolute top-3 right-3',
        inline: 'relative',
      },
    },
    defaultVariants: { position: 'bottom-left' },
  },
);

type ThemeColor = NonNullable<StatusDotProps['color']>;

export interface MapLegendItem {
  /** StatusDot theme color or arbitrary hex (e.g. '#FF9800') */
  color: ThemeColor | (string & {});
  label: string;
  count?: number;
}

export interface MapLegendProps extends VariantProps<typeof mapLegendVariants> {
  items: MapLegendItem[];
  title?: string;
  className?: string;
}

const THEME_COLORS = new Set<string>([
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'muted',
  'inProgress',
]);

function isThemeColor(color: string): color is ThemeColor {
  return THEME_COLORS.has(color);
}

export function MapLegend({ items, title, position, className }: Readonly<MapLegendProps>) {
  if (items.length === 0) return null;

  return (
    <section className={cn(mapLegendVariants({ position }), className)} aria-label={title ?? 'Map legend'}>
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {title}
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-foreground">
            {isThemeColor(item.color) ? (
              <span className={statusDotVariants({ color: item.color, size: 'md' })} aria-hidden="true" />
            ) : (
              <span
                className="inline-block shrink-0 rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
            )}
            <span className="leading-tight">{item.label}</span>
            {item.count != null && (
              <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                {item.count}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export { mapLegendVariants };
export default MapLegend;
