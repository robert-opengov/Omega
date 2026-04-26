'use client';

/**
 * AiCodeDialog — single-shot AI code generation summoned from a `code`
 * PropDefinition in PropertiesPanel (gated by `pageBuilder.codeProp`).
 *
 * Flow:
 *   1. User describes what they want.
 *   2. We call `generateCodeAction` (server-side wrapper around the
 *      AI gateway) and stream back a single code block.
 *   3. User clicks "Use this code" to write the result back to the
 *      enclosing prop.
 *
 * Removal recipe: same as the code editor branch — flip
 * `pageBuilder.codeProp` off OR delete this file.
 */

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { Button, Label, Textarea, Text } from '@/components/ui/atoms';
import { Modal } from '@/components/ui/molecules';
import { generateCodeAction } from '@/app/actions/ai/generate-code';
import type { PropDefinition } from '@/lib/page-builder/page-component-registry';

export interface AiCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: NonNullable<PropDefinition['language']>;
  /** Current source so the model can refine instead of rewrite from scratch. */
  existing?: string;
  /** Short note (e.g. "this prop is a click handler"). */
  context?: string;
  onApply: (code: string) => void;
}

export function AiCodeDialog({
  open,
  onOpenChange,
  language,
  existing,
  context,
  onApply,
}: AiCodeDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setPrompt('');
    setCode(null);
    setError(null);
  };

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateCodeAction({
        prompt: prompt.trim(),
        language,
        existing,
        context,
      });
      if (!res.success || !res.code) {
        setError(res.error ?? 'Generation failed.');
        return;
      }
      setCode(res.code);
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title="Generate code with AI"
      description={`Language: ${language}`}
      size="lg"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt">What should the code do?</Label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Format a record's createdAt date as a relative string"
            rows={3}
          />
          <Text size="xs" color="muted">
            The model returns a single code block. You can edit it before applying.
          </Text>
        </div>

        {error && (
          <Text size="sm" className="text-danger-text">
            {error}
          </Text>
        )}

        {code !== null && (
          <div className="space-y-1.5">
            <Label>Generated</Label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={generate}
              disabled={isPending || prompt.trim().length === 0}
              icon={Sparkles}
            >
              {isPending ? 'Generating…' : code ? 'Regenerate' : 'Generate'}
            </Button>
            {code && (
              <Button
                type="button"
                onClick={() => {
                  onApply(code);
                  onOpenChange(false);
                  reset();
                }}
              >
                Use this code
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
