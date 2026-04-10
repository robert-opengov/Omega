'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Optional visible label above the slider. */
  label?: string;
}

/**
 * A range slider built on Radix UI with CDS-37 shadow and focus tokens.
 *
 * @example
 * <Slider defaultValue={[50]} max={100} step={1} />
 *
 * @example
 * <Slider label="Volume" value={[volume]} onValueChange={([v]) => setVolume(v)} />
 */
const Slider = forwardRef<HTMLSpanElement, SliderProps>(
  ({ className, label, ...props }, ref) => {
    const labelId = label ? `slider-label-${(label || '').replaceAll(/\s+/g, '-').toLowerCase()}` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <span id={labelId} className="text-sm font-semibold text-foreground">{label}</span>
            <span className="text-sm text-muted-foreground">{props.value?.[0] ?? props.defaultValue?.[0] ?? 0}</span>
          </div>
        )}
        <SliderPrimitive.Root
          ref={ref}
          aria-labelledby={labelId}
          className={cn('relative flex w-full touch-none select-none items-center', className)}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className={cn(
              'block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-soft transition-all duration-200 ease-in-out',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          />
        </SliderPrimitive.Root>
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
export default Slider;
