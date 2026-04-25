'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Badge, Code, Text } from '@/components/ui/atoms';
import { Alert } from '@/components/ui/molecules';
import { cn } from '@/lib/utils';
import type {
  StepExecution,
  WorkflowInstance,
} from '@/lib/core/ports/workflow.repository';

const STATUS = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    tone: 'text-success-text',
    badge: 'success' as const,
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    tone: 'text-destructive',
    badge: 'danger' as const,
  },
  running: {
    label: 'Running',
    icon: Clock,
    tone: 'text-info-text',
    badge: 'info' as const,
  },
  waiting: {
    label: 'Waiting',
    icon: Clock,
    tone: 'text-warning-text',
    badge: 'warning' as const,
  },
  pending: {
    label: 'Pending',
    icon: Circle,
    tone: 'text-muted-foreground',
    badge: 'default' as const,
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    tone: 'text-muted-foreground',
    badge: 'default' as const,
  },
  skipped: {
    label: 'Skipped',
    icon: Circle,
    tone: 'text-muted-foreground',
    badge: 'default' as const,
  },
} as const;

function statusFor(status: string) {
  return STATUS[status as keyof typeof STATUS] ?? STATUS.pending;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function durationMs(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

interface StepRowProps {
  step: StepExecution;
  isLast: boolean;
}

function StepRow({ step, isLast }: Readonly<StepRowProps>) {
  const [open, setOpen] = useState(step.status === 'failed');
  const cfg = statusFor(step.status);
  const Icon = cfg.icon;
  const dur = durationMs(step.startedAt, step.completedAt);
  const hasDetail = step.input || step.output || step.error;

  return (
    <li className="relative pl-8">
      {!isLast ? (
        <span
          className="absolute left-[15px] top-7 bottom-0 w-px bg-border"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          'absolute left-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-card',
          cfg.tone,
        )}
        aria-hidden
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="rounded border border-border bg-card p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Text size="sm" weight="medium">
            {step.stepType.replace(/_/g, ' ')}
          </Text>
          <Badge variant={cfg.badge} size="sm">
            {cfg.label}
          </Badge>
          <Code className="text-[10px]">{step.stepId}</Code>
          <div className="flex-1" />
          <Text size="xs" color="muted">
            {formatDate(step.startedAt)}
          </Text>
          {dur ? (
            <Text size="xs" color="muted">
              · {dur}
            </Text>
          ) : null}
        </div>

        {step.error ? (
          <div className="mt-2">
            <Alert variant="error">{step.error}</Alert>
          </div>
        ) : null}

        {hasDetail ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              aria-expanded={open}
              aria-label="Toggle step details"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Details
            </button>
            {open ? (
              <div className="mt-2 space-y-2">
                {step.input ? (
                  <div>
                    <Text size="xs" weight="bold" color="muted" className="block mb-1 uppercase tracking-wider">
                      Input
                    </Text>
                    <pre className="text-[11px] font-mono bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(step.input, null, 2)}
                    </pre>
                  </div>
                ) : null}
                {step.output ? (
                  <div>
                    <Text size="xs" weight="bold" color="muted" className="block mb-1 uppercase tracking-wider">
                      Output
                    </Text>
                    <pre className="text-[11px] font-mono bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export interface InstanceTraceViewerProps {
  instance: WorkflowInstance;
  workflowName?: string;
}

export function InstanceTraceViewer({
  instance,
  workflowName,
}: Readonly<InstanceTraceViewerProps>) {
  const cfg = statusFor(instance.status);
  const Icon = cfg.icon;
  const steps = instance.steps ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className={cn('h-5 w-5', cfg.tone)} />
          <Text size="sm" weight="medium">
            {workflowName ?? instance.workflowId}
          </Text>
          <Badge variant={cfg.badge} size="sm">
            {cfg.label}
          </Badge>
          <Code className="text-[10px]">{instance.id}</Code>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="font-medium">{formatDate(instance.startedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd className="font-medium">{formatDate(instance.completedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Duration</dt>
            <dd className="font-medium">
              {durationMs(instance.startedAt, instance.completedAt) ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Trigger record</dt>
            <dd className="font-medium truncate">{instance.triggerRecordId ?? '—'}</dd>
          </div>
        </dl>
        {instance.error ? <Alert variant="error">{instance.error}</Alert> : null}
      </div>

      {steps.length === 0 ? (
        <div className="rounded border border-dashed border-border bg-muted/30 p-6 text-center">
          <Text size="sm" color="muted">
            No step executions recorded for this run.
          </Text>
        </div>
      ) : (
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <StepRow key={step.id} step={step} isLast={i === steps.length - 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

export default InstanceTraceViewer;
