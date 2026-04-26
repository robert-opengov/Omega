'use client';

/**
 * VersionsDialog — lists historical revisions stored on
 * `GabCustomComponent.codeHistory` and lets the editor diff or roll back
 * to any of them. Wraps `rollbackCustomComponentAction`, so the actual
 * persistence shape is owned by the existing port/adapter.
 *
 * Gated by `app.customComponentLifecycle` at the editor entry point.
 */

import { useMemo, useState, useTransition } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { Button, Text, Badge } from '@/components/ui/atoms';
import { Modal, ConfirmDialog, Alert } from '@/components/ui/molecules';
import { useToast } from '@/providers/toast-provider';
import { rollbackCustomComponentAction } from '@/app/actions/custom-components';
import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';
import { DiffViewer } from './DiffViewer';

interface CodeHistoryEntry {
  version: number;
  code: string;
  props_schema?: unknown;
  default_props?: unknown;
  updatedAt?: string;
}

function parseHistory(raw: unknown): CodeHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): CodeHistoryEntry | null => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as Record<string, unknown>;
      const version = typeof e.version === 'number' ? e.version : Number(e.version);
      if (!Number.isFinite(version)) return null;
      return {
        version,
        code: typeof e.code === 'string' ? e.code : '',
        props_schema: e.props_schema,
        default_props: e.default_props,
        updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : undefined,
      };
    })
    .filter((x): x is CodeHistoryEntry => x !== null)
    .sort((a, b) => b.version - a.version);
}

export interface VersionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
  component: GabCustomComponent;
  /** Live editor source — diffs against the selected version. */
  liveCode: string;
  /** Disable the rollback button (e.g. sandbox mode). */
  schemaLocked?: boolean;
  /** Called after a successful rollback so the editor can refresh. */
  onRolledBack?: () => void;
}

export function VersionsDialog({
  open,
  onOpenChange,
  appId,
  component,
  liveCode,
  schemaLocked = false,
  onRolledBack,
}: VersionsDialogProps) {
  const history = useMemo(() => parseHistory(component.codeHistory), [component.codeHistory]);
  const [selected, setSelected] = useState<number | null>(history[0]?.version ?? null);
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const selectedEntry = history.find((h) => h.version === selected);

  const onRollback = (version: number) => {
    startTransition(async () => {
      const res = await rollbackCustomComponentAction(appId, component.key, version);
      if (res.success) {
        addToast(`Restored to v${version}.`, 'success');
        setConfirmVersion(null);
        onOpenChange(false);
        onRolledBack?.();
      } else {
        addToast(res.error ?? 'Rollback failed.', 'error');
      }
    });
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Version history"
        description={`Component ${component.name} (current v${component.version})`}
        size="3xl"
      >
        {history.length === 0 ? (
          <Alert variant="info">
            No previous versions saved yet. The next save will create the
            first historical entry.
          </Alert>
        ) : (
          <div className="grid grid-cols-[14rem_1fr] gap-4">
            <ul className="border-r border-border pr-3 space-y-1 max-h-[55vh] overflow-y-auto">
              {history.map((entry) => {
                const active = entry.version === selected;
                return (
                  <li key={entry.version}>
                    <button
                      type="button"
                      onClick={() => setSelected(entry.version)}
                      className={
                        'w-full text-left rounded px-2 py-1.5 text-sm transition-colors flex items-center justify-between gap-2 ' +
                        (active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted')
                      }
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <History className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">v{entry.version}</span>
                      </span>
                      {entry.version === component.version - 1 && (
                        <Badge size="sm" variant="default">
                          previous
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="min-w-0 space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {selectedEntry ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Text size="sm" color="muted">
                      Comparing v{selectedEntry.version} → live editor
                    </Text>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={RotateCcw}
                      disabled={schemaLocked || isPending}
                      onClick={() => setConfirmVersion(selectedEntry.version)}
                    >
                      Restore this version
                    </Button>
                  </div>
                  <DiffViewer
                    before={selectedEntry.code}
                    after={liveCode}
                    beforeLabel={`v${selectedEntry.version}`}
                    afterLabel="editor"
                  />
                </>
              ) : (
                <Text size="sm" color="muted">
                  Select a version to see the diff.
                </Text>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmVersion !== null}
        onOpenChange={(v) => !v && setConfirmVersion(null)}
        title={`Restore v${confirmVersion}?`}
        description="This will overwrite the current source with the selected version. The current source is preserved as a new history entry, so you can roll forward again later."
        confirmLabel="Restore"
        variant="primary"
        loading={isPending}
        onConfirm={() => confirmVersion !== null && onRollback(confirmVersion)}
      />
    </>
  );
}
