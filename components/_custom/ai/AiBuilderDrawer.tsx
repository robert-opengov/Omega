'use client';

/**
 * AI Builder drawer — app-modification surface.
 *
 * Sister to `AiAssistantDrawer`, but with a system prompt that frames
 * the model as an editor (creates rows, updates rows, drafts pages).
 * Gated by `services.aiAppBuilder` so a fork can ship the read-only
 * assistant without enabling write tools.
 */

import { useState, useTransition, useCallback } from 'react';
import { Sheet } from '@/components/ui/molecules';
import { AIConversation, type AIMessageData, AIPromptInput, AIDisclaimer } from '@/components/ui/organisms';
import { converseAction } from '@/app/actions/ai/converse';

const SYSTEM_PROMPT = [
  'You are the GAB AI Builder.',
  'You help users design and modify their app: tables, forms, pages, and records.',
  'When you propose a change, describe it as an explicit list of operations the user can review.',
  'Default to suggestions — the user must confirm any writes.',
].join(' ');

export interface AiBuilderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiBuilderDrawer({ open, onOpenChange }: AiBuilderDrawerProps) {
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
          inferenceConfig: { temperature: 0.3, maxTokens: 2000 },
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
      title="AI Builder"
      description="Describe app changes; the model proposes edits you can confirm."
      side="right"
      size="lg"
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <AIConversation
            messages={messages}
            loading={isPending}
            emptyPlaceholder={
              <AIDisclaimer className="max-w-md" />
            }
          />
        </div>
        <div className="border-t border-border p-3 space-y-2">
          <AIPromptInput
            value={input}
            onChange={setInput}
            onSubmit={send}
            loading={isPending}
            placeholder="Describe the change you want…"
          />
        </div>
      </div>
    </Sheet>
  );
}
