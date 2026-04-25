'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  GitCompare,
  History,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge, Button, Heading, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  FormField,
  Modal,
  PageHeader,
  ZodForm,
} from '@/components/ui/molecules';
import { z } from 'zod';
import {
  createSandboxAction,
  discardSandboxAction,
  promoteSandboxAction,
  restoreBackupAction,
} from '@/app/actions/sandbox';
import type { GabApp } from '@/lib/core/ports/app.repository';
import type { SchemaBackup } from '@/lib/core/ports/sandbox.repository';
import { SandboxDiffView } from './SandboxDiffView';

const createSandboxSchema = z.object({
  name: z.string().optional(),
  includeData: z.boolean().optional(),
});

type CreateSandboxValues = z.infer<typeof createSandboxSchema>;

export interface SandboxPanelProps {
  app: GabApp;
  initialBackups: SchemaBackup[];
  backupsError: string | null;
}

export function SandboxPanel({ app, initialBackups, backupsError }: SandboxPanelProps) {
  const router = useRouter();
  const isSandbox = !!app.sandboxOf;
  const isLocked = !!app.schemaLockedAt;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sandbox"
        description={
          isSandbox
            ? 'This app is a sandbox of a production app. Edit schema here, then promote.'
            : 'Create a sandbox to edit schema safely without disrupting production data.'
        }
        condensed
        status={
          isSandbox
            ? [{ label: 'Sandbox', variant: 'warning' }]
            : isLocked
              ? [{ label: 'Schema locked', variant: 'danger' }]
              : [{ label: 'Production', variant: 'success' }]
        }
      />

      {isSandbox ? (
        <SandboxControls app={app} router={router} />
      ) : (
        <ProductionControls
          app={app}
          backups={initialBackups}
          backupsError={backupsError}
          router={router}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sandbox view (this app IS a sandbox of another app)
// ---------------------------------------------------------------------------

function SandboxControls({
  app,
  router,
}: {
  app: GabApp;
  router: ReturnType<typeof useRouter>;
}) {
  const [diffOpen, setDiffOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [deleteAfterPromote, setDeleteAfterPromote] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const promote = () => {
    setError(null);
    startTransition(async () => {
      const res = await promoteSandboxAction(app.id, {
        deleteSandbox: deleteAfterPromote,
      });
      if (!res.success) {
        setError(res.error);
        setConfirmPromote(false);
        return;
      }
      setConfirmPromote(false);
      if (deleteAfterPromote && app.sandboxOf) {
        router.replace(`/apps/${app.sandboxOf}`);
      }
      router.refresh();
    });
  };

  const discard = () => {
    setError(null);
    startTransition(async () => {
      const res = await discardSandboxAction(app.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDiscard(false);
        return;
      }
      router.replace(app.sandboxOf ? `/apps/${app.sandboxOf}` : '/apps');
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sandbox of production</CardTitle>
          <CardDescription>
            Promoting copies schema changes back to the production app. A backup is
            taken automatically just before promotion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded border border-border bg-muted/40">
            <Boxes className="h-5 w-5 text-warning-text shrink-0" />
            <div className="min-w-0 flex-1">
              <Text size="sm" weight="medium">{app.name}</Text>
              <Text size="xs" color="muted" className="font-mono truncate">{app.key}</Text>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-right">
              <Text size="xs" color="muted">Production</Text>
              {app.sandboxOf ? (
                <Link
                  href={`/apps/${app.sandboxOf}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open production app
                </Link>
              ) : (
                <Text size="sm" color="muted">unknown</Text>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <Text size="sm">{error}</Text>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDiffOpen(true)}>
              <GitCompare className="h-4 w-4 mr-1.5" />
              View diff
            </Button>
            <Button variant="primary" onClick={() => setConfirmPromote(true)}>
              <Upload className="h-4 w-4 mr-1.5" />
              Promote to production
            </Button>
            <Button variant="danger" onClick={() => setConfirmDiscard(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Discard sandbox
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={diffOpen}
        onOpenChange={setDiffOpen}
        title="Schema diff"
        description="Changes between this sandbox and the production app."
        size="xl"
      >
        <SandboxDiffView sandboxAppId={app.id} />
      </Modal>

      <Modal
        open={confirmPromote}
        onOpenChange={setConfirmPromote}
        title="Promote sandbox to production?"
        description="A schema backup is taken before changes are applied. Reads against affected tables may pause briefly during promotion."
        primaryAction={{
          label: pending ? 'Promoting…' : 'Promote',
          onClick: promote,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setConfirmPromote(false),
        }}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary h-4 w-4 rounded"
            checked={deleteAfterPromote}
            onChange={(e) => setDeleteAfterPromote(e.target.checked)}
          />
          Delete this sandbox after a successful promotion
        </label>
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        variant="danger"
        title="Discard this sandbox?"
        description="The sandbox database and all unmerged schema edits will be permanently dropped. Production is not affected."
        confirmLabel={pending ? 'Discarding…' : 'Discard sandbox'}
        loading={pending}
        onConfirm={discard}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Production view (no active sandbox — offer create + backups)
// ---------------------------------------------------------------------------

function ProductionControls({
  app,
  backups,
  backupsError,
  router,
}: {
  app: GabApp;
  backups: SchemaBackup[];
  backupsError: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmRestore, setConfirmRestore] = useState<SchemaBackup | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleCreate = (values: CreateSandboxValues) => {
    setCreateError(null);
    startTransition(async () => {
      const res = await createSandboxAction(app.id, {
        ...(values.name ? { name: values.name } : {}),
        includeData: !!values.includeData,
      });
      if (!res.success) {
        setCreateError(res.error);
        return;
      }
      setCreateOpen(false);
      router.push(`/apps/${res.data.appId}/sandbox`);
      router.refresh();
    });
  };

  const handleRestore = () => {
    if (!confirmRestore) return;
    setRestoreError(null);
    const target = confirmRestore;
    startTransition(async () => {
      const res = await restoreBackupAction(app.id, target.id);
      if (!res.success) {
        setRestoreError(res.error);
        setConfirmRestore(null);
        return;
      }
      setConfirmRestore(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create a sandbox</CardTitle>
          <CardDescription>
            Spins up a parallel database with the same schema. Optionally copy
            production data so you can test migrations end-to-end.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            disabled={!!app.schemaLockedAt}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New sandbox
          </Button>
          {app.schemaLockedAt && (
            <Text size="xs" color="muted" className="mt-2 inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Schema is currently locked — sandbox creation is paused.
            </Text>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <History className="h-4 w-4" />
            Schema backups
          </CardTitle>
          <CardDescription>
            Backups are written automatically before each sandbox promotion. Restore
            rolls the live schema back to that snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {restoreError && (
            <div className="flex items-start gap-2 p-2 mb-3 rounded bg-danger-light text-danger-text">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <Text size="sm">{restoreError}</Text>
            </div>
          )}
          {backupsError ? (
            <Text size="sm" className="text-danger-text">{backupsError}</Text>
          ) : backups.length === 0 ? (
            <EmptyState
              icon={History}
              title="No backups yet"
              description="Backups appear here automatically the first time you promote a sandbox."
            />
          ) : (
            <ul className="divide-y divide-border rounded border border-border">
              {backups.map((backup) => (
                <li
                  key={backup.id}
                  className="px-3 py-2.5 flex items-center justify-between gap-3"
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

      <Modal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
        title="New sandbox"
        description={`Forks the schema of "${app.name}" into a separate database.`}
      >
        <ZodForm
          schema={createSandboxSchema}
          defaultValues={{ name: '', includeData: false }}
          onSubmit={handleCreate}
        >
          {({ register, formState: { errors } }) => (
            <div className="space-y-4">
              <FormField
                label="Sandbox name"
                hint="Defaults to the production app name with a `(sandbox)` suffix."
                error={errors.name?.message}
                {...register('name')}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary h-4 w-4 rounded"
                  {...register('includeData')}
                />
                Copy production data into the sandbox
              </label>
              {createError && (
                <Text size="sm" className="text-danger-text">{createError}</Text>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={pending}>
                  {pending ? 'Creating…' : 'Create sandbox'}
                </Button>
              </div>
            </div>
          )}
        </ZodForm>
      </Modal>

      <ConfirmDialog
        open={!!confirmRestore}
        onOpenChange={(open) => {
          if (!open) setConfirmRestore(null);
        }}
        variant="danger"
        title="Restore from backup?"
        description={
          confirmRestore
            ? `Roll the live schema back to "${confirmRestore.reason || confirmRestore.id}" (${new Date(confirmRestore.createdAt).toLocaleString()}). Schema changes since this backup will be lost.`
            : ''
        }
        confirmLabel={pending ? 'Restoring…' : 'Restore backup'}
        loading={pending}
        onConfirm={handleRestore}
      />

      <Heading as="h3" className="sr-only">{backups.length} backups</Heading>
    </div>
  );
}
