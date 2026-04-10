'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/atoms';
import { X, MoreVertical, FileText } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FilePreviewCardProps {
  name: string;
  description?: string;
  layout?: 'horizontal' | 'vertical';
  previewSrc?: string;
  previewIcon?: ReactNode;
  progress?: number;
  isSelected?: boolean;
  onActionClick?: () => void;
  onClick?: () => void;
  onClose?: () => void;
  className?: string;
}

export function FilePreviewCard({
  name,
  description,
  layout = 'horizontal',
  previewSrc,
  previewIcon,
  progress,
  isSelected = false,
  onActionClick,
  onClick,
  onClose,
  className,
}: FilePreviewCardProps) {
  const isVertical = layout === 'vertical';

  const fallbackIcon = previewIcon ?? <FileText className="h-8 w-8" />;

  const preview = previewSrc ? (
    <img src={previewSrc} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="flex items-center justify-center h-full w-full text-muted-foreground">{fallbackIcon}</div>
  );

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={cn(
        'relative rounded border bg-card transition-all duration-200 overflow-hidden',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        onClick && 'cursor-pointer hover:shadow-medium',
        isVertical ? 'flex flex-col' : 'flex flex-row items-center',
        className,
      )}
    >
      <div
        className={cn(
          'shrink-0 bg-muted overflow-hidden',
          isVertical ? 'h-32 w-full' : 'h-16 w-16',
        )}
      >
        {preview}
      </div>

      <div className={cn('flex-1 min-w-0', isVertical ? 'p-3' : 'px-3 py-2')}>
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        {description && <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>}
        {progress != null && progress >= 0 && progress <= 100 && (
          <div className="mt-2">
            <Progress value={progress} size="sm" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 px-2">
        {onActionClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onActionClick(); }}
            className="p-1 rounded hover:bg-action-hover text-muted-foreground transition-colors duration-200"
            aria-label="File actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
        {onClose && (
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 rounded hover:bg-action-hover text-muted-foreground transition-colors duration-200"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default FilePreviewCard;
