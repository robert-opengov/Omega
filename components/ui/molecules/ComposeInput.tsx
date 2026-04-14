'use client';

import { useState, type ElementType, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Avatar, Button, Input } from '@/components/ui/atoms';

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
  footer?: ReactNode;
  className?: string;
}

export function ComposeInput({
  avatar,
  placeholder = 'Write something...',
  onSubmit,
  submitLabel = 'Submit',
  mediaTypes = [],
  footer,
  variant,
  size,
  className,
}: ComposeInputProps) {
  const [content, setContent] = useState('');
  const resolvedSize = size ?? 'md';
  const isCompact = variant === 'compact';

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit?.(content);
      setContent('');
    }
  };

  return (
    <div className={cn(composeInputVariants({ variant, size }), className)}>
      <div className="flex items-center gap-3">
        <Avatar
          src={avatar?.src}
          fallback={avatar?.fallback || 'U'}
          size={avatarSizeMap[resolvedSize]}
        />
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          aria-label="Compose a message"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button variant="primary" size={resolvedSize === 'sm' ? 'sm' : 'md'} onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>
      {!isCompact && mediaTypes.length > 0 && (
        <div className="flex items-center gap-2">
          {mediaTypes.map(({ label, icon: Icon }) => (
            <Button key={label} variant="outline" size="sm" icon={Icon} className="flex-1">
              {label}
            </Button>
          ))}
        </div>
      )}
      {footer}
    </div>
  );
}

export { composeInputVariants };
export default ComposeInput;
