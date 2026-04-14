'use client';

import { useRef, useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Spinner, IconButton, Avatar } from '@/components/ui/atoms';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AIMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  files?: { name: string; type: string }[];
  error?: boolean;
}

/* ------------------------------------------------------------------ */
/*  AIMessage                                                          */
/* ------------------------------------------------------------------ */

export interface AIMessageProps extends HTMLAttributes<HTMLDivElement> {
  /** Message data object. */
  message: AIMessageData;
  /** Custom renderer for message content. When omitted, content renders as plain text. */
  renderContent?: (content: string) => ReactNode;
  /** Action buttons to show on hover (copy, retry, etc.). */
  actions?: ReactNode;
}

/**
 * A single message bubble within an AI conversation.
 *
 * User messages align right with a primary tint; assistant messages
 * align left with a muted background. Supports file previews and
 * error states.
 *
 * @example
 * <AIMessage message={{ id: '1', role: 'user', content: 'Hello' }} />
 */
export function AIMessage({ message, renderContent, actions, className, ...props }: AIMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'group flex gap-3 max-w-[85%]',
        isUser ? 'ml-auto flex-row-reverse' : '',
        className
      )}
      {...props}
    >
      <Avatar
        size="sm"
        fallback={isUser ? 'U' : 'AI'}
        className={cn('shrink-0 mt-0.5', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}
      />

      <div className="flex flex-col gap-1 min-w-0">
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {message.files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground border border-border">
                {f.name}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            'rounded px-3 py-2 text-sm leading-relaxed',
            isUser
              ? 'bg-primary/10 text-foreground'
              : 'bg-muted text-foreground',
            message.error && 'border border-destructive/50 bg-danger-light text-danger-text'
          )}
        >
          {renderContent ? renderContent(message.content) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        <div className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          {message.timestamp && (
            <Text size="xs" color="muted">{message.timestamp}</Text>
          )}
          {actions ?? (
            <IconButton
              icon={Copy}
              label="Copy message"
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard?.writeText(message.content)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AIConversation                                                     */
/* ------------------------------------------------------------------ */

export interface AIConversationProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of message objects to render. */
  messages: AIMessageData[];
  /** When true, shows a typing indicator at the bottom. */
  loading?: boolean;
  /** Placeholder shown when there are no messages. */
  emptyPlaceholder?: ReactNode;
  /** Custom renderer for message content (applied to all messages). */
  renderContent?: (content: string) => ReactNode;
  /** Maximum content width class. @default 'max-w-3xl' */
  maxWidthClassName?: string;
}

/**
 * A full AI conversation view with auto-scrolling, user/assistant
 * message styling, typing indicators, and hover actions.
 *
 * @example
 * <AIConversation messages={messages} loading={isGenerating} />
 */
export function AIConversation({
  messages,
  loading,
  emptyPlaceholder,
  renderContent,
  maxWidthClassName = 'max-w-3xl',
  className,
  ...props
}: AIConversationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center p-8', className)} {...props}>
        {emptyPlaceholder ?? (
          <Text color="muted" className="text-center">
            Start a conversation by typing a message below.
          </Text>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('flex-1 overflow-y-auto p-4', className)} {...props}>
      <div className={cn('mx-auto space-y-4', maxWidthClassName)}>
        {messages.map((msg) => (
          <AIMessage key={msg.id} message={msg} renderContent={renderContent} />
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <Avatar size="sm" fallback="AI" className="shrink-0 mt-0.5 bg-muted" />
            <div className="rounded px-3 py-2 bg-muted">
              <div className="flex items-center gap-1.5">
                <Spinner size="sm" />
                <Text size="sm" color="muted">Thinking...</Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIConversation;
