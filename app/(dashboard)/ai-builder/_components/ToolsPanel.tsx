'use client';

import { useState } from 'react';
import { Button, Heading, Spinner } from '@/components/ui/atoms';
import { Alert } from '@/components/ui/molecules';
import { Wrench } from 'lucide-react';
import type { AIMessageData } from '@/components/ui/organisms';
import { generateSchemaFromConversationAction } from '../actions';

interface ToolsPanelProps {
  messages: AIMessageData[];
  disabled?: boolean;
}

interface SchemaResult {
  success: boolean;
  created?: {
    appKey: string;
    tableKeys: string[];
    fieldKeys: string[];
  };
  error?: string;
}

export function ToolsPanel({ messages, disabled }: ToolsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SchemaResult | null>(null);

  const hasAssistantTurn = messages.some((m) => m.role === 'assistant' && m.content.length > 0);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const bedrockMessages = messages
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: [{ text: m.content }],
        }));
      const res = await generateSchemaFromConversationAction(bedrockMessages);
      setResult(res);
    } catch {
      setResult({ success: false, error: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border">
      <Heading as="h4" className="text-xs uppercase tracking-wider text-muted-foreground">
        Tools
      </Heading>

      <Button
        variant="outline"
        size="sm"
        fullWidth
        onClick={handleGenerate}
        disabled={disabled || loading || !hasAssistantTurn}
        loading={loading}
        icon={Wrench}
      >
        Generate schema from chat
      </Button>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          Extracting schema and creating resources...
        </div>
      )}

      {result && !loading && (
        <Alert
          variant={result.success ? 'success' : 'error'}
          title={result.success ? 'Schema created' : 'Failed'}
          dismissible
          onDismiss={() => setResult(null)}
        >
          {result.success ? (
            <span className="text-sm">
              App <strong>{result.created?.appKey}</strong> created with{' '}
              {result.created?.tableKeys.length} table(s) and{' '}
              {result.created?.fieldKeys.length} field(s).
            </span>
          ) : (
            <span className="text-sm">{result.error}</span>
          )}
        </Alert>
      )}
    </div>
  );
}
