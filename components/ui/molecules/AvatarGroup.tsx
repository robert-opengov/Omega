'use client';

import { Avatar, type AvatarProps } from '@/components/ui/atoms';
import { cn } from '@/lib/utils';

export interface AvatarGroupProps {
  /** Array of avatar data to display. */
  avatars: { src?: string; fallback: string; alt?: string }[];
  /** Maximum number of visible avatars before showing "+N". @default 4 */
  max?: number;
  /** @default 'md' */
  size?: AvatarProps['size'];
  className?: string;
}

/**
 * Displays a stack of overlapping avatars with an overflow indicator.
 *
 * @example
 * <AvatarGroup avatars={users} max={3} />
 */
export function AvatarGroup({ avatars, max = 4, size = 'md', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div
      className={cn('flex -space-x-2', className)}
      role="group"
      aria-label={`${avatars.length} users`}
    >
      {visible.map((avatar, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          <Avatar src={avatar.src} fallback={avatar.fallback} alt={avatar.alt} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'ring-2 ring-background rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium',
            size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-xs'
          )}
          aria-label={`${overflow} more users`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default AvatarGroup;
