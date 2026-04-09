'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  /** @default 'Add a tag...' */
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

/**
 * A text input that converts typed values into removable tag chips.
 *
 * Press Enter or comma to add a tag, Backspace to remove the last one.
 *
 * @example
 * <TagInput tags={tags} onTagsChange={setTags} maxTags={5} />
 */
export function TagInput({ tags, onTagsChange, placeholder = 'Add a tag...', maxTags, className }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    if (maxTags && tags.length >= maxTags) return;
    onTagsChange([...tags, trimmed]);
    setInput('');
  }, [tags, maxTags, onTagsChange]);

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded border border-border bg-background px-3 py-2 transition-all duration-300 ease-in-out focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
        className
      )}
      role="group"
      aria-label="Tag input"
    >
      {tags.map((tag, i) => (
        <span key={`${tag}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="rounded-full p-0.5 hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input) addTag(input); }}
        placeholder={tags.length === 0 ? placeholder : ''}
        disabled={maxTags ? tags.length >= maxTags : false}
        className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        aria-label="Add tag"
        aria-describedby={maxTags ? 'tag-input-hint' : undefined}
      />
      {maxTags && (
        <span id="tag-input-hint" className="sr-only">
          Maximum {maxTags} tags allowed
        </span>
      )}
    </div>
  );
}

export default TagInput;
