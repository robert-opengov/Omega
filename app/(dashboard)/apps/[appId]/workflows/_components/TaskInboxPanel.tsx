'use client';

import { useState, useTransition } from 'react';
import { Badge, Button, Text, Textarea } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  EmptyState,
  Modal,
} from '@/components/ui/molecules';
import {
  approveTaskAction,
  rejectTaskAction,
  type ActionResult,
} from '@/app/actions/workflow-tasks';
import type { WorkflowTask } from '@/lib/core/ports/workflow.repository';

interface TaskInboxPanelProps {
  appId: string;
  initialTasks: WorkflowTask[];
  workflowNameById?: Record<string, string>;
  onTasksChange?: (tasks: WorkflowTask[]) => void;
}

type Action = 'approve' | 'reject';

export function TaskInboxPanel({
  appId,
  initialTasks,
  workflowNameById = {},
  onTasksChange,
}: Readonly<TaskInboxPanelProps>) {
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingAction, setPendingAction] = useState<{
    task: WorkflowTask;
    action: Action;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleMutation = <T,>(
    res: ActionResult<T>,
    onSuccess: (data: T) => void,
  ) => {
    if (!res.success || res.data === undefined) {
      setError(res.error ?? 'Request failed');
      return;
    }
    setError(null);
    onSuccess(res.data);
  };

  const onConfirm = () => {
    if (!pendingAction) return;
    const { task, action } = pendingAction;
    const trimmedNotes = notes.trim() || undefined;
    startTransition(async () => {
      const res =
        action === 'approve'
          ? await approveTaskAction(appId, task.id, { notes: trimmedNotes })
          : await rejectTaskAction(appId, task.id, { notes: trimmedNotes });
      handleMutation(res, () => {
        const next = tasks.filter((t) => t.id !== task.id);
        setTasks(next);
        onTasksChange?.(next);
        setPendingAction(null);
        setNotes('');
      });
    });
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            title="Inbox is clear"
            description="Approval tasks assigned to your roles will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Text size="sm" className="text-destructive">
          {error}
        </Text>
      ) : null}
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {task.roleName || 'Reviewer'}
                </Badge>
                {task.prompt ? (
                  <span className="text-sm text-foreground">{task.prompt}</span>
                ) : (
                  <span className="text-sm text-foreground">
                    Approval requested
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Workflow:{' '}
                {workflowNameById[task.instanceId] ??
                  workflowNameById[task.stepId] ??
                  task.instanceId}{' '}
                · created {new Date(task.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setPendingAction({ task, action: 'reject' });
                  setNotes('');
                }}
              >
                Reject
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setPendingAction({ task, action: 'approve' });
                  setNotes('');
                }}
              >
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Modal
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
            setNotes('');
          }
        }}
        title={
          pendingAction?.action === 'approve' ? 'Approve task?' : 'Reject task?'
        }
        description={
          pendingAction?.action === 'approve'
            ? 'This will advance the workflow to the next step.'
            : 'This will mark the workflow as rejected and stop execution.'
        }
        size="sm"
      >
        <div className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            aria-label="Notes"
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setPendingAction(null);
                setNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                pendingAction?.action === 'approve' ? 'primary' : 'danger'
              }
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending
                ? 'Processing…'
                : pendingAction?.action === 'approve'
                  ? 'Approve'
                  : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
