'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  AlertCircle,
  GitCompare,
  Package,
  Undo2,
  Upload,
} from 'lucide-react';
import { Badge, Button, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Modal,
} from '@/components/ui/molecules';
import {
  applyTemplateUpdateAction,
  getTemplateDiffAction,
  rollbackTemplateAction,
} from '@/app/actions/templates';
import type {
  GabAppSubscription,
  GabTemplate,
  ThreeWayDiff,
} from '@/lib/core/ports/template.repository';
import { ThreeWayDiffView } from './ThreeWayDiffView';

export interface TemplateSubscriptionCardProps {
  appId: string;
  subscription: GabAppSubscription;
  template: GabTemplate | null;
  templateError: string | null;
}

export function TemplateSubscriptionCard({
  appId,
  subscription,
  template,
  templateError,
}: TemplateSubscriptionCardProps) {
  const router = useRouter();
  const behind = template
    ? template.currentVersion - subscription.appliedVersion
    : 0;

  const [diffOpen, setDiffOpen] = useState(false);
  const [diff, setDiff] = useState<ThreeWayDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openDiff = async () => {
    setDiffOpen(true);
    if (diff) return;
    setDiffLoading(true);
    setDiffError(null);
    const res = await getTemplateDiffAction(appId);
    setDiffLoading(false);
    if (!res.success) {
      setDiffError(res.error);
      return;
    }
    setDiff(res.data);
  };

  const apply = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await applyTemplateUpdateAction(appId, {});
      if (!res.success) {
        setActionError(res.error);
        setApplyOpen(false);
        return;
      }
      setApplyOpen(false);
      setDiff(null);
      router.refresh();
    });
  };

  const rollback = () => {
    setActionError(null);
    if (subscription.appliedVersion <= 1) {
      setActionError('Already at the earliest applied version.');
      setRollbackOpen(false);
      return;
    }
    startTransition(async () => {
      const target = subscription.appliedVersion - 1;
      const res = await rollbackTemplateAction(appId, target);
      if (!res.success) {
        setActionError(res.error);
        setRollbackOpen(false);
        return;
      }
      setRollbackOpen(false);
      setDiff(null);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Package className="h-4 w-4" />
          Template subscription
        </CardTitle>
        <CardDescription>
          {template
            ? `Schema is tracked against "${template.name}".`
            : 'This app is subscribed to a template.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {templateError && (
          <Text size="xs" className="text-danger-text">{templateError}</Text>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {template && (
            <Link
              href={`/templates/${template.id}`}
              className="text-sm font-medium hover:underline"
            >
              {template.name}
            </Link>
          )}
          <Badge variant="default" size="sm">
            applied v{subscription.appliedVersion}
          </Badge>
          {template && (
            <Badge variant="info" size="sm">
              latest v{template.currentVersion}
            </Badge>
          )}
          {behind > 0 && (
            <Badge variant="warning" size="sm">{behind} behind</Badge>
          )}
          <Badge
            variant={subscription.updateStatus === 'up_to_date' ? 'success' : 'info'}
            size="sm"
          >
            {subscription.updateStatus.replace(/_/g, ' ')}
          </Badge>
        </div>

        {actionError && (
          <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <Text size="sm">{actionError}</Text>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={openDiff}>
            <GitCompare className="h-3.5 w-3.5 mr-1.5" />
            View diff
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setApplyOpen(true)}
            disabled={behind <= 0}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Apply update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRollbackOpen(true)}
            disabled={subscription.appliedVersion <= 1}
          >
            <Undo2 className="h-3.5 w-3.5 mr-1.5" />
            Rollback one version
          </Button>
        </div>
      </CardContent>

      <Modal
        open={diffOpen}
        onOpenChange={setDiffOpen}
        title="Template diff"
        description="Three-way diff between this app, the template baseline, and the latest version."
        size="xl"
      >
        {diffLoading && <Text size="sm" color="muted">Loading diff…</Text>}
        {diffError && <Text size="sm" className="text-danger-text">{diffError}</Text>}
        {diff && <ThreeWayDiffView diff={diff} />}
      </Modal>

      <ConfirmDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        title="Apply template update?"
        description="The schema will be migrated to the template's latest published version. A backup is taken automatically."
        confirmLabel={pending ? 'Applying…' : 'Apply update'}
        loading={pending}
        onConfirm={apply}
      />

      <ConfirmDialog
        open={rollbackOpen}
        onOpenChange={setRollbackOpen}
        variant="danger"
        title="Rollback one version?"
        description={`Schema will be reverted to v${Math.max(1, subscription.appliedVersion - 1)}. A backup is taken before rollback.`}
        confirmLabel={pending ? 'Rolling back…' : 'Rollback'}
        loading={pending}
        onConfirm={rollback}
      />
    </Card>
  );
}
