'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, Plus, Send, Trash2, Edit3 } from 'lucide-react';
import { Badge, Button, Switch, Text } from '@/components/ui/atoms';
import { ConfirmDialog, Modal } from '@/components/ui/molecules';
import {
  createNotificationAction,
  deleteNotificationAction,
  testNotificationAction,
  updateNotificationAction,
} from '@/app/actions/notifications';
import type {
  CreateNotificationParams,
  GabNotification,
} from '@/lib/core/ports/notification.repository';
import { NotificationEditor } from './NotificationEditor';

interface NotificationsPanelProps {
  appId: string;
  tables: { id: string; name: string }[];
  selectedTableId: string | null;
  initialNotifications: GabNotification[];
}

export function NotificationsPanel({
  appId,
  tables,
  selectedTableId,
  initialNotifications,
}: NotificationsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<GabNotification[]>(initialNotifications);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GabNotification | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GabNotification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isMutating, startMutation] = useTransition();

  const onTableChange = (id: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tableId', id);
    router.replace(`?${sp.toString()}`);
    router.refresh();
  };

  const onCreate = (values: CreateNotificationParams) => {
    setError(null);
    startMutation(async () => {
      const res = await createNotificationAction(appId, values);
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to create notification.');
        return;
      }
      setNotifications((prev) => [res.data!, ...prev]);
      setEditorOpen(false);
      setEditing(null);
    });
  };

  const onUpdate = (values: CreateNotificationParams) => {
    if (!editing) return;
    setError(null);
    startMutation(async () => {
      const res = await updateNotificationAction(appId, editing.id, values);
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to update notification.');
        return;
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === editing.id ? res.data! : n)),
      );
      setEditorOpen(false);
      setEditing(null);
    });
  };

  const onDelete = (notification: GabNotification) => {
    setError(null);
    startMutation(async () => {
      const res = await deleteNotificationAction(appId, notification.id);
      if (!res.success) {
        setError(res.error ?? 'Failed to delete notification.');
        setConfirmDelete(null);
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setConfirmDelete(null);
    });
  };

  const onTest = (notification: GabNotification) => {
    setError(null);
    setInfo(null);
    startMutation(async () => {
      const res = await testNotificationAction(appId, notification.id);
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to send test.');
        return;
      }
      setInfo(res.data.message || 'Test notification queued.');
    });
  };

  const onToggleActive = (notification: GabNotification, active: boolean) => {
    setError(null);
    startMutation(async () => {
      const res = await updateNotificationAction(appId, notification.id, { active });
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to update notification.');
        return;
      }
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? res.data! : n)));
    });
  };

  const tableName = tables.find((t) => t.id === selectedTableId)?.name ?? '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Table</label>
        <select
          className="rounded border border-border bg-background px-3 py-1.5 text-sm flex-1 max-w-sm"
          value={selectedTableId ?? ''}
          onChange={(e) => onTableChange(e.target.value)}
        >
          {tables.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          disabled={!selectedTableId}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New notification
        </Button>
      </div>

      {error && <Text size="sm" className="text-danger-text">{error}</Text>}
      {info && <Text size="sm" className="text-success-text">{info}</Text>}

      {notifications.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <Text size="sm" color="muted">
            No notifications configured for {tableName || 'this table'}.
          </Text>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md">
          {notifications.map((n) => (
            <li key={n.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Text size="sm" weight="medium">{n.name}</Text>
                  <Badge variant="default" size="sm">{n.triggerType}</Badge>
                  <Badge variant="default" size="sm">{n.channel}</Badge>
                  <Badge variant="default" size="sm">{n.recipientType}</Badge>
                </div>
                {n.description && (
                  <Text size="xs" color="muted">{n.description}</Text>
                )}
                <Text size="xs" color="muted" className="mt-0.5 truncate">
                  Subject: {n.subjectTemplate}
                </Text>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={n.active}
                    onCheckedChange={(checked) => onToggleActive(n, checked)}
                    aria-label={n.active ? 'Disable notification' : 'Enable notification'}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTest(n)}
                  disabled={isMutating}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Test
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(n);
                    setEditorOpen(true);
                  }}
                  aria-label="Edit notification"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(n)}
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4 text-danger-text" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditing(null);
            setError(null);
          }
        }}
        title={editing ? `Edit notification` : 'New notification'}
        size="2xl"
      >
        {selectedTableId && (
          <NotificationEditor
            tableId={selectedTableId}
            initial={editing ?? undefined}
            isSaving={isMutating}
            onSubmit={(values) => (editing ? onUpdate(values) : onCreate(values))}
            onCancel={() => setEditorOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        variant="danger"
        title={`Delete "${confirmDelete?.name}"?`}
        description="This notification will be removed and any pending sends will be discarded."
        confirmLabel={isMutating ? 'Deleting…' : 'Delete'}
        loading={isMutating}
        onConfirm={() => confirmDelete && onDelete(confirmDelete)}
      />
    </div>
  );
}
