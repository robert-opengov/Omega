'use client';

import { useCallback, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { Button, Heading, Text, Input, Label } from '@/components/ui/atoms';
import { Card, CardContent, PageHeader, Alert } from '@/components/ui/molecules';
import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';
import { updateCustomComponentAction } from '@/app/actions/custom-components';
import {
  analyzeCustomComponentCode,
  type AnalyzeIssue,
} from '@/lib/page-builder/custom-component-analyze';
import { useTheme } from '@/providers/theme-provider';
import { useRouter } from 'next/navigation';
import { CustomComponentPreviewFrame } from './CustomComponentPreviewFrame';

const DEFAULT_CODE = `export default function MyComponent() {
  return (
    <div className="p-4 border border-dashed border-border rounded text-sm text-muted-foreground">
      Custom component — connect to GAB data in the full runtime.
    </div>
  );
}
`;

export function CustomComponentEditorClient({
  appId,
  component,
  schemaLocked = false,
}: {
  appId: string;
  component: GabCustomComponent;
  schemaLocked?: boolean;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [name, setName] = useState(component.name);
  const [code, setCode] = useState(component.code || DEFAULT_CODE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysis = useMemo(() => analyzeCustomComponentCode(code), [code]);
  const extensions = useMemo(() => [javascript({ jsx: true, typescript: true })], []);

  const save = useCallback(async () => {
    if (schemaLocked) return;
    if (!analysis.ok) {
      setError(analysis.errors[0]?.message ?? 'Fix analysis errors first');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await updateCustomComponentAction(appId, component.key, { name, code });
    setSaving(false);
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error ?? 'Save failed');
    }
  }, [analysis.ok, analysis.errors, appId, component.key, name, code, router, schemaLocked]);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={component.name}
        description={`Key: ${component.key} · v${component.version}`}
      />
      {schemaLocked && (
        <Alert variant="warning" title="Schema locked">
          This app&apos;s schema is locked (sandbox mode). Edits are
          read-only. Promote the sandbox to production to save changes.
        </Alert>
      )}
      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {!analysis.ok && (
        <Alert variant="error" title="Static check">
          <ul className="list-disc pl-4 text-sm">
            {analysis.errors.map((e: AnalyzeIssue, i) => (
              <li key={i}>
                {e.message}
                {e.line ? ` (line ${e.line})` : ''}
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {analysis.warnings.length > 0 && (
        <Alert variant="warning" title="Static check warnings">
          <ul className="list-disc pl-4 text-sm">
            {analysis.warnings.map((w: AnalyzeIssue, i) => (
              <li key={i}>
                {w.message}
                {w.line ? ` (line ${w.line})` : ''}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-3 space-y-3">
            <div>
              <Label htmlFor="cc-name">Name</Label>
              <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Text size="sm" className="mb-1">Source (React/TSX)</Text>
              <div className="overflow-hidden rounded border border-border text-sm">
                <CodeMirror
                  value={code}
                  height="320px"
                  theme={resolvedTheme === 'dark' ? oneDark : undefined}
                  extensions={extensions}
                  onChange={(v) => setCode(v)}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={save}
              disabled={saving || schemaLocked}
              loading={saving}
            >
              Save
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Heading as="h3" className="text-sm font-semibold">
            Sandbox preview
          </Heading>
          <Text size="xs" color="muted">
            Iframe uses a minimal bridge; full GAB SDK injection is a follow-up.
          </Text>
          <CustomComponentPreviewFrame code={code} />
        </div>
      </div>
    </div>
  );
}
