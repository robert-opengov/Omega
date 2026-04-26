'use client';

/**
 * AI Assistant drawer — runtime help, read-only tool access.
 *
 * Sheet-based panel that lets a user chat with the model and call
 * read-side tools (`listTables`, `fetchRows`, etc.). Mounted by
 * `AiSurface` and gated by `services.aiAssistant`.
 */

import { useState, useTransition, useCallback } from 'react';
import { Sheet } from '@/components/ui/molecules';
import { AIConversation, type AIMessageData, AIPromptInput } from '@/components/ui/organisms';
import { Text } from '@/components/ui/atoms';
import { converseAction } from '@/app/actions/ai/converse';

const SYSTEM_PROMPT = [
  'You are the GAB AI Assistant.',
  'Answer questions about the user\'s app data and configuration.',
  'When you need information, briefly describe which tool you would call (the tool layer is read-only).',
  'Never claim to have made changes — you cannot mutate state from this drawer.',
].join(' ');

export interface AiAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiAssistantDrawer({ open, onOpenChange }: AiAssistantDrawerProps) {
  const [messages, setMessages] = useState<AIMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const send = useCallback(
    (value: string) => {
      const userMsg: AIMessageData = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: value,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      startTransition(async () => {
        const res = await converseAction({
          systemPrompt: SYSTEM_PROMPT,
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: [{ text: m.content }],
            })),
            { role: 'user', content: [{ text: value }] },
          ],
          inferenceConfig: { temperature: 0.4, maxTokens: 1500 },
        });

        const replyId = `a-${Date.now()}`;
        if (!res.success) {
          setMessages((prev) => [
            ...prev,
            {
              id: replyId,
              role: 'assistant',
              content: res.error,
              error: true,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: replyId,
            role: 'assistant',
            content: res.text,
            timestamp: new Date().toISOString(),
          },
        ]);
      });
    },
    [messages],
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="AI Assistant"
      description="Ask questions about your app — read-only access."
      side="right"
      size="lg"
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <AIConversation
            messages={messages}
            loading={isPending}
            emptyPlaceholder={
              <Text size="sm" color="muted" className="text-center max-w-xs">
                Ask about tables, forms, pages, or specific records. The
                assistant cannot make changes from this drawer.
              </Text>
            }
          />
        </div>
        <div className="border-t border-border p-3">
          <AIPromptInput
            value={input}
            onChange={setInput}
            onSubmit={send}
            loading={isPending}
            placeholder="Ask the assistant…"
          />
        </div>
      </div>
    </Sheet>
  );
}
