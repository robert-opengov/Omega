'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Play, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { Badge, Button, Progress, Text } from '@/components/ui/atoms';
import { ConfirmDialog } from '@/components/ui/molecules';
import {
  clearFailedJobsAction,
  deleteFailedJobAction,
  getRecomputeStatusAction,
  recomputeAllAction,
  retryFailedJobAction,
} from '@/app/actions/jobs';
import type { FailedJob, RecomputeProgress } from '@/lib/core/ports/job.repository';

function isActive(status: string): boolean {
  return status === 'queued' || status === 'running';
}

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'running':
      return 'info';
    case 'queued':
      return 'warning';
    default:
      return 'default';
  }
}

interface RecomputeProps {
  appId: string;
  initialProgress: RecomputeProgress;
}

function Recompute({ appId, initialProgress }: RecomputeProps) {
  const [progress, setProgress] = useState<RecomputeProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, startStart] = useTransition();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive(progress.status)) {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const res = await getRecomputeStatusAction(appId);
      if (cancelled) return;
      if (res.success) setProgress(res.data);
      pollingRef.current = setTimeout(tick, 2000);
    };
    pollingRef.current = setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [appId, progress.status]);

  const onStart = () => {
    setError(null);
    startStart(async () => {
      const res = await recomputeAllAction(appId);
      if (!res.success) {
        setError(res.error);
        return;
      }
      const status = await getRecomputeStatusAction(appId);
      if (status.success) setProgress(status.data);
    });
  };

  const pct =
    progress.progress != null
      ? Math.round(progress.progress * 100)
      : progress.totalTables && progress.completedTables != null
        ? Math.round((progress.completedTables / Math.max(1, progress.totalTables)) * 100)
        : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant(progress.status)} size="sm">{progress.status}</Badge>
        {progress.startedAt && (
          <Text size="xs" color="muted">
            started {new Date(progress.startedAt).toLocaleString()}
          </Text>
        )}
        {progress.completedAt && (
          <Text size="xs" color="muted">
            · completed {new Date(progress.completedAt).toLocaleString()}
          </Text>
        )}
      </div>
      {(isActive(progress.status) || pct != null) && (
        <div className="space-y-1">
          <Progress value={pct ?? 0} max={100} />
          <Text size="xs" color="muted">
            {progress.completedTables ?? 0}
            {progress.totalTables ? ` / ${progress.totalTables}` : ''} table
            {progress.totalTables === 1 ? '' : 's'}
            {pct != null ? ` · ${pct}%` : ''}
          </Text>
        </div>
      )}
      {progress.error && (
        <Text size="sm" className="text-danger-text">{progress.error}</Text>
      )}
      {error && (
        <Text size="sm" className="text-danger-text">{error}</Text>
      )}
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={onStart} disabled={isStarting || isActive(progress.status)}>
          <Play className="h-4 w-4 mr-1.5" />
          {isStarting ? 'Starting…' : isActive(progress.status) ? 'Running…' : 'Recompute all'}
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const res = await getRecomputeStatusAction(appId);
            if (res.success) setProgress(res.data);
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

interface FailedProps {
  appId: string;
  initialFailed: FailedJob[];
}

function Failed({ appId, initialFailed }: FailedProps) {
  const [items, setItems] = useState<FailedJob[]>(initialFailed);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isMutating, startMutate] = useTransition();

  const onRetry = (job: FailedJob) => {
    setError(null);
    startMutate(async () => {
      const res = await retryFailedJobAction(appId, job.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setItems((prev) => prev.filter((j) => j.id !== job.id));
    });
  };

  const onDelete = (job: FailedJob) => {
    setError(null);
    startMutate(async () => {
      const res = await deleteFailedJobAction(appId, job.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setItems((prev) => prev.filter((j) => j.id !== job.id));
    });
  };

  const onClear = () => {
    setError(null);
    startMutate(async () => {
      const res = await clearFailedJobsAction(appId);
      if (!res.success) {
        setError(res.error);
        setConfirmClear(false);
        return;
      }
      setItems([]);
      setConfirmClear(false);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text size="sm" color="muted">{items.length} failed job{items.length === 1 ? '' : 's'}</Text>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClear(true)}
            disabled={isMutating}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Clear all
          </Button>
        )}
      </div>
      {error && <Text size="sm" className="text-danger-text">{error}</Text>}
      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <Text size="sm" color="muted">No failed jobs.</Text>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md max-h-[420px] overflow-y-auto">
          {items.map((job) => (
            <li key={job.id} className="px-3 py-2.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Text size="sm" weight="medium" className="font-mono truncate">{job.type}</Text>
                  <Badge variant="default" size="sm">{job.attempts} attempts</Badge>
                </div>
                {job.error && (
                  <Text size="xs" className="text-danger-text truncate block max-w-md">{job.error}</Text>
                )}
                <Text size="xs" color="muted">
                  Failed {new Date(job.failedAt).toLocaleString()}
                </Text>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry(job)}
                  disabled={isMutating}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(job)}
                  disabled={isMutating}
                  aria-label="Dismiss"
                >
                  <Trash2 className="h-4 w-4 text-danger-text" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        variant="danger"
        title="Clear all failed jobs?"
        description="All failed jobs will be permanently dismissed. This cannot be undone."
        confirmLabel={isMutating ? 'Clearing…' : 'Clear all'}
        loading={isMutating}
        onConfirm={onClear}
      />
    </div>
  );
}

export const JobsPanel = { Recompute, Failed };
