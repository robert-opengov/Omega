'use client';

import { useRef, useState, useTransition } from 'react';
import { AlertCircle, Download, History, RefreshCw, Upload } from 'lucide-react';
import { Badge, Button, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  PageHeader,
} from '@/components/ui/molecules';
import {
  exportSchemaAction,
  importSchemaAction,
  restoreBackupAction,
} from '@/app/actions/sandbox';
import {
  getOcrJobResultAction,
  getOcrJobStatusAction,
  startOcrJobAction,
} from '@/app/actions/ocr';
import { ocrLoadingMessages } from '@/config/ocr.config';
import type { SchemaBackup } from '@/lib/core/ports/sandbox.repository';

interface BackupsPanelProps {
  appId: string;
  appName: string;
  initialBackups: SchemaBackup[];
  initialError?: string | null;
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BackupsPanel({
  appId,
  appName,
  initialBackups,
  initialError = null,
}: Readonly<BackupsPanelProps>) {
  const [backups] = useState(initialBackups);
  const [error, setError] = useState<string | null>(initialError);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<SchemaBackup | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrResultText, setOcrResultText] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportSchemaAction(appId);
      if (!result.success) {
        setError(result.error ?? 'Failed to export schema.');
        return;
      }
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      downloadJson(`${appName}-schema-${ts}.json`, result.data);
    });
  };

  const handleImport = async (file?: File | null) => {
    if (!file) return;
    setSelectedImportFile(file);
    setImportSuccess(null);
    setOcrStatus(null);
    setOcrMessage(null);
    setOcrResultText(null);
  };

  const runImport = () => {
    if (!selectedImportFile) return;
    setError(null);
    setImportSuccess(null);
    startTransition(async () => {
      try {
        const text = await selectedImportFile.text();
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const result = await importSchemaAction(appId, parsed);
        if (!result.success) {
          setError(result.error ?? 'Failed to import schema.');
          return;
        }
        setImportSuccess(`Imported schema from ${selectedImportFile.name}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON file.');
      }
    });
  };

  const runOcr = () => {
    if (!selectedImportFile) return;
    setError(null);
    setOcrResultText(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('file', selectedImportFile);
      const started = await startOcrJobAction(fd);
      if (!started.success) {
        setError(started.error ?? 'Failed to start OCR.');
        return;
      }
      const jobId = started.data.jobId;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        setOcrStatus(`Polling OCR job ${jobId}…`);
        setOcrMessage(ocrLoadingMessages[attempt % ocrLoadingMessages.length]);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const statusRes = await getOcrJobStatusAction(jobId);
        if (!statusRes.success) {
          setError(statusRes.error ?? 'Failed to poll OCR job.');
          return;
        }
        if (statusRes.data.status === 'COMPLETED') {
          const resultRes = await getOcrJobResultAction(jobId);
          if (!resultRes.success) {
            setError(resultRes.error ?? 'Failed to fetch OCR result.');
            return;
          }
          setOcrStatus('OCR complete.');
          setOcrResultText(resultRes.data.fullText || '(No text extracted)');
          return;
        }
        if (statusRes.data.status === 'FAILED') {
          setError(statusRes.data.error || 'OCR job failed.');
          return;
        }
      }
      setError('OCR job timed out. Try again.');
    });
  };

  const handleRestore = () => {
    if (!confirmRestore) return;
    const target = confirmRestore;
    setError(null);
    startTransition(async () => {
      const result = await restoreBackupAction(appId, target.id);
      if (!result.success) {
        setError(result.error ?? 'Failed to restore backup.');
      }
      setConfirmRestore(null);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups"
        description="Export and import schema snapshots, or restore an automatic backup."
        condensed
      />

      <Card>
        <CardHeader>
          <CardTitle>Schema file operations</CardTitle>
          <CardDescription>
            Export downloads the current schema as JSON. Import applies a JSON
            schema document to this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleExport} disabled={pending}>
              <Download className="h-4 w-4 mr-1.5" />
              Export schema
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Choose import file
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={runImport}
              disabled={pending || !selectedImportFile}
            >
              Import schema
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={runOcr}
              disabled={pending || !selectedImportFile}
            >
              OCR preview
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
            />
          </div>
          {selectedImportFile ? (
            <Text size="xs" color="muted">
              Selected file: {selectedImportFile.name}
            </Text>
          ) : null}
          {importSuccess ? (
            <Text size="xs" className="text-success-text">
              {importSuccess}
            </Text>
          ) : null}
          {ocrStatus ? (
            <Text size="xs" color="muted">
              {ocrStatus}
            </Text>
          ) : null}
          {ocrMessage ? (
            <Text size="xs" color="muted">
              {ocrMessage}
            </Text>
          ) : null}
          {ocrResultText ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/30 p-2 text-xs">
              {ocrResultText}
            </pre>
          ) : null}
          <Text size="xs" color="muted">
            Importing a schema may replace existing objects; review in a sandbox first when possible.
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <History className="h-4 w-4" />
            Automatic backups
          </CardTitle>
          <CardDescription>
            Backups are written automatically before each sandbox promotion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-3 flex items-start gap-2 rounded bg-danger-light p-2 text-danger-text">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <Text size="sm">{error}</Text>
            </div>
          ) : null}
          {backups.length === 0 ? (
            <EmptyState
              icon={History}
              title="No backups yet"
              description="Backups appear automatically after sandbox promotions."
            />
          ) : (
            <ul className="divide-y divide-border rounded border border-border">
              {backups.map((backup) => (
                <li
                  key={backup.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Text size="sm" weight="medium" className="truncate">
                      {backup.reason || 'Schema backup'}
                    </Text>
                    <Text size="xs" color="muted">
                      {new Date(backup.createdAt).toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">
                      <span className="font-mono">{backup.id.slice(0, 8)}</span>
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRestore(backup)}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Restore
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmRestore}
        onOpenChange={(open) => {
          if (!open) setConfirmRestore(null);
        }}
        variant="danger"
        title="Restore from backup?"
        description={
          confirmRestore
            ? `Roll the live schema back to "${confirmRestore.reason || confirmRestore.id}" (${new Date(confirmRestore.createdAt).toLocaleString()}).`
            : ''
        }
        confirmLabel={pending ? 'Restoring…' : 'Restore backup'}
        loading={pending}
        onConfirm={handleRestore}
      />
    </div>
  );
}
