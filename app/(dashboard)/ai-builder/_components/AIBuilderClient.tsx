'use client';

import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Button, Heading, IconButton, Text } from '@/components/ui/atoms';
import { Sheet } from '@/components/ui/molecules';
import { AIConversation, AIPromptInput } from '@/components/ui/organisms';
import type { AIMessageData } from '@/components/ui/organisms';
import type { AIMessage } from '@/lib/core/ports/ai-gateway.port';
import { chat } from '@/lib/ai/client';
import { Settings, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemPromptPanel, type AIBuilderSettings } from './SystemPromptPanel';
import { ToolsPanel } from './ToolsPanel';
import { renderMarkdown } from './MarkdownContent';
import {
  DEFAULT_SYSTEM_PROMPT,
  MODEL_OPTIONS,
  INFERENCE_DEFAULTS,
  MESSAGE_MAX_LENGTH,
} from '../_constants';

interface AIBuilderClientProps {
  defaultModelId: string;
}

const DEFAULT_SETTINGS: AIBuilderSettings = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  modelId: MODEL_OPTIONS[0].value,
  temperature: INFERENCE_DEFAULTS.temperature,
  maxTokens: INFERENCE_DEFAULTS.maxTokens,
};

function EmptyPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 text-center max-w-md">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <Heading as="h2" className="text-lg">
        AI Builder
      </Heading>
      <Text color="muted" className="text-sm leading-relaxed">
        Describe the application you want to build. The AI will help you design schemas,
        tables, fields, and data models for your government application.
      </Text>
      <Text color="muted" size="xs">
        Tip: Open settings to customize the system prompt, model, and parameters.
      </Text>
    </div>
  );
}

export function AIBuilderClient({ defaultModelId }: AIBuilderClientProps) {
  const [settings, setSettings] = useState<AIBuilderSettings>({
    ...DEFAULT_SETTINGS,
    modelId: defaultModelId || DEFAULT_SETTINGS.modelId,
  });
  const [messages, setMessages] = useState<AIMessageData[]>([]);
  const [bedrockMessages, setBedrockMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chromeHeight, setChromeHeight] = useState(84);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    setChromeHeight(top);
  }, []);

  const handleReset = useCallback(() => {
    setMessages([]);
    setBedrockMessages([]);
    setInput('');
    setError(null);
    setIsLoading(false);
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: AIMessageData = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const newBedrockMessages: AIMessage[] = [
      ...bedrockMessages,
      { role: 'user', content: [{ text }] },
    ];

    try {
      const result = await chat(newBedrockMessages, {
        systemPrompt: settings.systemPrompt,
        modelId: settings.modelId,
        inferenceConfig: {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        },
      });

      if (!result.success) {
        setError(result.error);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: result.error, error: true, timestamp },
        ]);
        return;
      }

      const assistantMsg: AIMessageData = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setBedrockMessages([
        ...newBedrockMessages,
        { role: 'assistant', content: [{ text: result.text }] },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: msg, error: true },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, bedrockMessages, settings]);

  const sidebarContent = (
    <div className="flex flex-col gap-6">
      <SystemPromptPanel
        settings={settings}
        onChange={setSettings}
        disabled={isLoading}
      />
      <ToolsPanel messages={messages} disabled={isLoading} />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col overflow-hidden"
      style={{ height: `calc(100dvh - ${chromeHeight}px)` }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Heading as="h1" className="text-sm font-semibold">
            AI Builder
          </Heading>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && !isLoading && (
            <Button variant="ghost" size="sm" onClick={handleReset} icon={RotateCcw}>
              Reset
            </Button>
          )}
          <IconButton
            icon={Settings}
            label="Open settings"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Main content: sidebar + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          aria-label="Conversation settings"
          className="hidden lg:flex flex-col w-80 shrink-0 border-r border-border bg-background overflow-y-auto p-4"
        >
          {sidebarContent}
        </aside>

        {/* Mobile sidebar via Sheet */}
        <Sheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          title="AI Settings"
          side="left"
          size="sm"
        >
          <div className="p-4">
            {sidebarContent}
          </div>
        </Sheet>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <AIConversation
              messages={messages}
              loading={isLoading}
              emptyPlaceholder={<EmptyPlaceholder />}
              renderContent={renderMarkdown}
              className="h-full"
            />
          </div>

          {error && (
            <div className="px-4 py-2 bg-danger-light text-danger-text text-sm border-t border-danger-light-border">
              {error}
            </div>
          )}

          {/* Prompt input */}
          <div className={cn('border-t border-border bg-background p-4')}>
            <div className="max-w-3xl mx-auto">
              <AIPromptInput
                ref={inputRef}
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                loading={isLoading}
                disabled={isLoading}
                placeholder="Describe an app, ask about schema design, or discuss data models..."
                maxLength={MESSAGE_MAX_LENGTH}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
