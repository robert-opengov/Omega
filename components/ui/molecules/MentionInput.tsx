'use client';

import { useState, useRef, useEffect, useId, useCallback, type KeyboardEvent, type ChangeEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/atoms';
import { createPortal } from 'react-dom';

export interface Mentionable {
  id: string;
  label: string;
  sublabel?: string;
  avatar?: { src?: string; fallback?: ReactNode };
}

export interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  mentionables: Mentionable[];
  /** Character that triggers the mention dropdown @default '@' */
  trigger?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

interface MentionState {
  active: boolean;
  query: string;
  startPos: number;
}

/**
 * Textarea with mention support. Typing the trigger character (default `@`)
 * opens a dropdown to mention users/items. Inserts `@[label](id)` tokens.
 *
 * Full WAI-ARIA combobox pattern with keyboard navigation.
 */
export function MentionInput({
  value,
  onChange,
  mentionables,
  trigger = '@',
  placeholder,
  rows = 3,
  disabled,
  maxLength,
  className,
}: MentionInputProps) {
  const instanceId = useId();
  const listboxId = `${instanceId}-listbox`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mention, setMention] = useState<MentionState>({ active: false, query: '', startPos: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const filtered = mentionables.filter((m) =>
    m.label.toLowerCase().includes(mention.query.toLowerCase()),
  );

  const updateDropdownPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? 0;
    onChange(newValue);

    const textBeforeCursor = newValue.slice(0, cursorPos);
    const triggerIndex = textBeforeCursor.lastIndexOf(trigger);

    if (triggerIndex >= 0) {
      const charBeforeTrigger = triggerIndex > 0 ? textBeforeCursor[triggerIndex - 1] : ' ';
      if (charBeforeTrigger === ' ' || charBeforeTrigger === '\n' || triggerIndex === 0) {
        const queryText = textBeforeCursor.slice(triggerIndex + trigger.length);
        if (!queryText.includes(' ') && !queryText.includes('\n')) {
          setMention({ active: true, query: queryText, startPos: triggerIndex });
          setActiveIndex(0);
          updateDropdownPosition();
          return;
        }
      }
    }

    setMention({ active: false, query: '', startPos: 0 });
  }, [onChange, trigger, updateDropdownPosition]);

  const insertMention = useCallback((mentionable: Mentionable) => {
    const before = value.slice(0, mention.startPos);
    const after = value.slice(mention.startPos + trigger.length + mention.query.length);
    const token = `${trigger}[${mentionable.label}](${mentionable.id})`;
    const newValue = `${before}${token} ${after}`;
    onChange(newValue);
    setMention({ active: false, query: '', startPos: 0 });

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const newCursorPos = before.length + token.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    });
  }, [value, mention, trigger, onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mention.active || filtered.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filtered[activeIndex]) insertMention(filtered[activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setMention({ active: false, query: '', startPos: 0 });
        break;
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.querySelector(`[data-index="${activeIndex}"]`);
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const charCount = value.length;
  const isOverLimit = maxLength !== undefined && charCount > maxLength;
  const activeDescendant = mention.active && activeIndex >= 0 ? `${instanceId}-option-${activeIndex}` : undefined;

  return (
    <div className={cn('relative', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        role="combobox"
        aria-expanded={mention.active && filtered.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        aria-autocomplete="list"
        className={cn(
          'w-full rounded border border-input-border bg-background px-3 py-2 text-sm transition-all duration-200 resize-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'placeholder:text-muted-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
          isOverLimit && 'border-destructive',
        )}
      />
      {maxLength !== undefined && (
        <p className={cn('text-xs mt-1 text-right', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
          {charCount}/{maxLength}
        </p>
      )}

      {mention.active && filtered.length > 0 && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: textareaRef.current?.offsetWidth }}
          className="z-dropdown rounded border border-border bg-card shadow-medium max-h-48 overflow-y-auto"
        >
          {filtered.map((m, index) => (
            <button
              key={m.id}
              id={`${instanceId}-option-${index}`}
              data-index={index}
              role="option"
              aria-selected={index === activeIndex}
              type="button"
              onClick={() => insertMention(m)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                index === activeIndex && 'bg-action-hover-primary',
              )}
            >
              <Avatar
                src={m.avatar?.src}
                fallback={typeof m.avatar?.fallback === 'string' ? m.avatar.fallback : m.label[0]}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm">{m.label}</p>
                {m.sublabel && <p className="text-xs text-muted-foreground truncate">{m.sublabel}</p>}
              </div>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export default MentionInput;
