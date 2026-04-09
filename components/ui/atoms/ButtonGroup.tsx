'use client';

import { type HTMLAttributes, Children, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Stack direction for the grouped buttons. */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Groups related Button elements with shared borders and joined styling.
 *
 * Child buttons lose individual border-radius and share dividers so
 * they read as a single composite control.
 *
 * @example
 * <ButtonGroup>
 *   <Button variant="outline">Left</Button>
 *   <Button variant="outline">Center</Button>
 *   <Button variant="outline">Right</Button>
 * </ButtonGroup>
 *
 * @example
 * <ButtonGroup orientation="vertical">
 *   <Button variant="outline">Top</Button>
 *   <Button variant="outline">Bottom</Button>
 * </ButtonGroup>
 */
export function ButtonGroup({ orientation = 'horizontal', className, children, ...props }: ButtonGroupProps) {
  const isVertical = orientation === 'vertical';

  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div
      role="group"
      className={cn(
        'inline-flex',
        isVertical ? 'flex-col' : 'flex-row',
        className
      )}
      {...props}
    >
      {items.map((child, i) => {
        const isFirst = i === 0;
        const isLast = i === items.length - 1;

        const radiusClass = isVertical
          ? cn(
              '!rounded-none',
              isFirst && '!rounded-t',
              isLast && '!rounded-b',
              !isLast && 'border-b-0'
            )
          : cn(
              '!rounded-none',
              isFirst && '!rounded-l',
              isLast && '!rounded-r',
              !isLast && 'border-r-0'
            );

        return cloneElement(child as React.ReactElement<{ className?: string }>, {
          className: cn(
            (child as React.ReactElement<{ className?: string }>).props.className,
            radiusClass
          ),
        });
      })}
    </div>
  );
}

export default ButtonGroup;
