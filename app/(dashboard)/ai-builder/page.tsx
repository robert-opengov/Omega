'use client';

import { useState } from 'react';
import { Button, Heading, Text, Card, Input } from '@/components/ui';
import { buildAppAction } from './actions';

export default function AIBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBuild = async () => {
    if (!prompt) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await buildAppAction(prompt);
      setResult(res);
    } catch {
      setResult({ status: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-72px)]">
      <Card className="max-w-2xl w-full p-8 shadow-lg">
        <Heading as="h1" color="primary" className="mb-2">
          AI Builder Chat
        </Heading>
        <Text color="muted" className="mb-6">
          Describe the app you want to build. The AI will use the Clean Architecture translation layer to create the schema (Apps, Tables, Fields) in the GAB backend.
        </Text>

        <div className="space-y-4">
          <Input
            placeholder="e.g., Create a permitting app with an applications table..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <Button
            variant="primary"
            fullWidth
            onClick={handleBuild}
            loading={loading}
          >
            Generate App Schema
          </Button>
        </div>

        {result && (
          <div className={`mt-8 p-4 rounded-lg border ${result.status === 'error' ? 'bg-danger-light border-danger-light-border' : 'bg-success-light border-success-light-border'}`}>
            <Heading as="h3" className={`mb-2 ${result.status === 'error' ? 'text-danger-text' : 'text-success-text'}`}>
              {result.status === 'error' ? 'Error' : 'Success'}
            </Heading>
            <pre className="text-sm overflow-auto whitespace-pre-wrap text-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
