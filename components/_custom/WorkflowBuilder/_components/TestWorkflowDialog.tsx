'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, PlayCircle, SkipForward, XCircle } from 'lucide-react';
import { Badge, Button, Select, Spinner, Text, Textarea } from '@/components/ui/atoms';
import { Alert, FormField, Modal } from '@/components/ui/molecules';
import { fetchRowsAction, type GabRow } from '@/app/actions/data';
import { testWorkflowAction } from '@/app/actions/workflows';
import type {
  StepTraceResult,
  WorkflowTriggerOn,
} from '@/lib/core/ports/workflow.repository';
import type { GabTable } from '@/lib/core/ports/table.repository';

const STATUS: Record<
  StepTraceResult['status'],
  { label: string; icon: typeof CheckCircle2; tone: string; badge: 'success' | 'danger' | 'default' | 'warning' }
> = {
  completed: { label: 'Completed', icon: CheckCircle2, tone: 'text-success-text', badge: 'success' },
  failed: { label: 'Failed', icon: XCircle, tone: 'text-destructive', badge: 'danger' },
  skipped: { label: 'Skipped', icon: SkipForward, tone: 'text-muted-foreground', badge: 'default' },
  waiting: { label: 'Waiting', icon: Clock, tone: 'text-warning-text', badge: 'warning' },
};

export interface TestWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
  workflowId: string;
  triggerTableId: string | null;
  triggerOn?: WorkflowTriggerOn;
  tables: GabTable[];
}

export function TestWorkflowDialog({
  open,
  onOpenChange,
  appId,
  workflowId,
  triggerTableId,
  tables,
}: Readonly<TestWorkflowDialogProps>) {
  const [records, setRecords] = useState<GabRow[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [rawJson, setRawJson] = useState('{}');
  const [mode, setMode] = useState<'record' | 'json'>('record');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StepTraceResult[] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const triggerTable = tables.find((t) => t.id === triggerTableId);

  useEffect(() => {
    if (!open) return;
    if (!triggerTable) {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    setRecordsError(null);
    fetchRowsAction({
      tableKey: triggerTable.key,
      applicationKey: appId,
      limit: 50,
    })
      .then((res) => {
        if (res.success && res.data) {
          setRecords(res.data);
        } else {
          setRecordsError(res.error ?? 'Failed to load records.');
        }
      })
      .finally(() => setLoadingRecords(false));
  }, [open, triggerTable, appId]);

  useEffect(() => {
    if (!open) {
      setResults(null);
      setSelectedId('');
      setRawJson('{}');
      setRunError(null);
      setMode('record');
    }
  }, [open]);

  const onRun = async () => {
    setRunError(null);
    let recordData: Record<string, unknown> | null = null;
    if (mode === 'json') {
      try {
        recordData = JSON.parse(rawJson || '{}') as Record<string, unknown>;
      } catch {
        setRunError('Body is not valid JSON.');
        return;
      }
    } else {
      const r = records.find((x) => String(x.recordId ?? x.id) === selectedId);
      if (!r) {
        setRunError('Pick a record to test against.');
        return;
      }
      recordData = r as Record<string, unknown>;
    }
    setRunning(true);
    try {
      const res = await testWorkflowAction(appId, workflowId, recordData);
      if (!res.success || !res.data) {
        setRunError(res.error ?? 'Test failed.');
        return;
      }
      setResults(res.data.results);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Test workflow"
      description={
        triggerTable
          ? `Simulate a ${triggerTable.name} record running through the workflow.`
          : 'Set a trigger table on the workflow to test it.'
      }
      size="lg"
    >
      <div className="space-y-4">
        {!triggerTable ? (
          <Alert variant="warning">A trigger table is required to test this workflow.</Alert>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'record' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setMode('record')}
              >
                Existing record
              </Button>
              <Button
                type="button"
                variant={mode === 'json' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setMode('json')}
              >
                Raw JSON
              </Button>
            </div>

            {mode === 'record' ? (
              <FormField label="Trigger record">
                {loadingRecords ? (
                  <div className="py-2 flex items-center gap-2">
                    <Spinner size="sm" />
                    <Text size="sm" color="muted">Loading records…</Text>
                  </div>
                ) : recordsError ? (
                  <Alert variant="error">{recordsError}</Alert>
                ) : (
                  <Select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    aria-label="Trigger record"
                  >
                    <option value="">Select a record…</option>
                    {records.map((r) => {
                      const id = String(r.recordId ?? r.id);
                      const firstField = Object.entries(r).find(
                        ([k]) =>
                          !['id', 'recordId', 'tableId', 'createdAt', 'updatedAt', 'version'].includes(k),
                      );
                      const label = firstField
                        ? `#${id} — ${String(firstField[1] ?? '')}`
                        : `Record #${id}`;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </Select>
                )}
              </FormField>
            ) : (
              <FormField label="Record JSON" hint='Example: {"name":"Test","status":"open"}'>
                <Textarea
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  rows={5}
                  className="font-mono text-xs"
                  aria-label="Record JSON"
                />
              </FormField>
            )}

            {runError ? <Alert variant="error">{runError}</Alert> : null}

            {results ? (
              <div>
                <Text size="sm" weight="bold" className="block mb-2">
                  Execution results
                </Text>
                <ul className="space-y-2">
                  {results.map((r, i) => {
                    const cfg = STATUS[r.status] ?? STATUS.completed;
                    const Icon = cfg.icon;
                    return (
                      <li
                        key={`${r.stepId}-${i}`}
                        className="flex items-start gap-2 rounded border border-border bg-card p-2.5"
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.tone}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Text size="sm" weight="medium">
                              {r.stepType.replace(/_/g, ' ')}
                            </Text>
                            <Badge variant={cfg.badge} size="sm">
                              {cfg.label}
                            </Badge>
                          </div>
                          <Text size="xs" color="muted" className="block mt-0.5">
                            {r.message}
                          </Text>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={onRun}
                disabled={running}
                className="gap-1"
              >
                {running ? <Spinner size="sm" /> : <PlayCircle className="h-4 w-4" />}
                {running ? 'Running…' : 'Run test'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default TestWorkflowDialog;
