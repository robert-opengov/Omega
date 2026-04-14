'use client';

import { useState, useRef, useCallback, type ElementType, type ReactNode, type KeyboardEvent } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Avatar, Button, Input, Textarea } from '@/components/ui/atoms';

export interface ComposeInputMediaType {
  label: string;
  icon: ElementType;
}

const composeInputVariants = cva('rounded border border-border bg-card', {
  variants: {
    variant: {
      default: '',
      compact: '',
    },
    size: {
      sm: 'p-3 space-y-2',
      md: 'p-4 space-y-3',
      lg: 'p-5 space-y-4',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

const avatarSizeMap = { sm: 'sm' as const, md: 'md' as const, lg: 'lg' as const };

export interface ComposeInputProps extends VariantProps<typeof composeInputVariants> {
  avatar?: { src?: string; fallback?: string };
  placeholder?: string;
  onSubmit?: (content: string) => void;
  submitLabel?: ReactNode;
  mediaTypes?: ComposeInputMediaType[];
  /** Called when a media type button is clicked */
  onMediaClick?: (type: ComposeInputMediaType) => void;
  /** Called when files are attached (e.g. via drag-and-drop or file input) */
  onAttach?: (files: File[]) => void;
  /** Maximum character count; shows counter when set */
  maxLength?: number;
  /** When true, uses a Textarea with Shift+Enter for newlines and Enter to submit */
  multiline?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function ComposeInput({
  avatar,
  placeholder = 'Write something...',
  onSubmit,
  submitLabel = 'Submit',
  mediaTypes = [],
  onMediaClick,
  onAttach,
  maxLength,
  multiline = false,
  footer,
  variant,
  size,
  className,
}: ComposeInputProps) {
  const [content, setContent] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const resolvedSize = size ?? 'md';
  const isCompact = variant === 'compact';
  const charCount = content.length;
  const isOverLimit = maxLength !== undefined && charCount > maxLength;

  const handleSubmit = useCallback(() => {
    if (content.trim() && !isOverLimit) {
      onSubmit?.(content);
      setContent('');
    }
  }, [content, isOverLimit, onSubmit]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (multiline && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (!multiline) {
        handleSubmit();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAttach?.(Array.from(files));
      e.target.value = '';
    }
  };

  return (
    <div className={cn(composeInputVariants({ variant, size }), className)}>
      <div className={cn('flex gap-3', multiline ? 'items-start' : 'items-center')}>
        <Avatar
          src={avatar?.src}
          fallback={avatar?.fallback || 'U'}
          size={avatarSizeMap[resolvedSize]}
        />
        <div className="flex-1 min-w-0">
          {multiline ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              aria-label="Compose a message"
              rows={3}
              onKeyDown={handleKeyDown}
              className="resize-none"
            />
          ) : (
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              aria-label="Compose a message"
              onKeyDown={handleKeyDown}
            />
          )}
          {maxLength !== undefined && (
            <p className={cn('text-xs mt-1 text-right', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
        <Button variant="primary" size={resolvedSize === 'sm' ? 'sm' : 'md'} onClick={handleSubmit} disabled={isOverLimit || !content.trim()}>
          {submitLabel}
        </Button>
      </div>
      {!isCompact && mediaTypes.length > 0 && (
        <div className="flex items-center gap-2">
          {mediaTypes.map((mediaType) => (
            <Button
              key={mediaType.label}
              variant="outline"
              size="sm"
              icon={mediaType.icon}
              className="flex-1"
              onClick={() => onMediaClick?.(mediaType)}
            >
              {mediaType.label}
            </Button>
          ))}
        </div>
      )}
      {onAttach && (
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileChange} aria-hidden="true" />
      )}
      {footer}
    </div>
  );
}

export { composeInputVariants };
export default ComposeInput;
