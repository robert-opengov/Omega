'use client';

import { forwardRef, useRef, useCallback, type KeyboardEvent, type HTMLAttributes } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/atoms';

export interface AIPromptInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'onSubmit'> {
  /** Current input value. */
  value: string;
  /** Called when the text content changes. */
  onChange: (value: string) => void;
  /** Called when the user submits the prompt. */
  onSubmit: (value: string) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** When true, shows a loading spinner on the send button. */
  loading?: boolean;
  disabled?: boolean;
  /** Maximum character count. Shows a counter when set. */
  maxLength?: number;
  /** When true, renders an attachment button. */
  showAttach?: boolean;
  /** Called when the attachment button is clicked. */
  onAttach?: () => void;
}

/**
 * A chat prompt input with an auto-growing textarea, send button,
 * optional file attachment, and character counter.
 *
 * Submit on Enter (Shift+Enter for newline). Matches OpenGov's
 * AI Prompt Input component.
 *
 * @example
 * <AIPromptInput value={input} onChange={setInput} onSubmit={handleSend} />
 *
 * @example
 * <AIPromptInput
 *   value={input}
 *   onChange={setInput}
 *   onSubmit={handleSend}
 *   loading={isGenerating}
 *   maxLength={2000}
 *   showAttach
 * />
 */
const AIPromptInput = forwardRef<HTMLTextAreaElement, AIPromptInputProps>(
  ({
    value,
    onChange,
    onSubmit,
    placeholder = 'Type a message...',
    loading,
    disabled,
    maxLength,
    showAttach,
    onAttach,
    className,
    ...props
  }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef;

    const autoGrow = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [textareaRef]);

    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed || loading || disabled) return;
      onSubmit(trimmed);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const isEmpty = !value.trim();
    const overLimit = maxLength ? value.length > maxLength : false;

    return (
      <div className={cn('flex flex-col gap-1', className)} {...props}>
        <div
          className={cn(
            'flex items-end gap-2 rounded border border-border bg-background px-3 py-2 transition-all duration-300',
            'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {showAttach && (
            <button
              type="button"
              onClick={onAttach}
              disabled={disabled || loading}
              className="flex items-center justify-center shrink-0 h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-300 disabled:opacity-50"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); autoGrow(); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[32px] max-h-[200px] py-1',
              disabled && 'cursor-not-allowed'
            )}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isEmpty || loading || disabled || overLimit}
            className={cn(
              'flex items-center justify-center shrink-0 h-8 w-8 rounded-full transition-all duration-300',
              'bg-primary text-primary-foreground',
              'hover:shadow-[inset_0_1em_1em_-1em_hsl(var(--primary-h)_var(--primary-s)_calc(var(--primary-l)+15%)_/_0.7)]',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
            )}
            aria-label="Send message"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {maxLength !== undefined && maxLength > 0 && (
          <div className="flex justify-end px-1">
            <Text size="xs" color={overLimit ? 'destructive' : 'muted'}>
              {value.length}/{maxLength}
            </Text>
          </div>
        )}
      </div>
    );
  }
);
AIPromptInput.displayName = 'AIPromptInput';

export { AIPromptInput };
export default AIPromptInput;
