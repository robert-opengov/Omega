'use client';

/**
 * ShareDialog — promotes a personal custom component into the
 * app-shared visibility tier so other editors can drop it into pages.
 *
 * Wraps `shareCustomComponentAction`; the underlying repo handles the
 * actual visibility flip + audit row. The dialog is purely a confirm +
 * status surface, gated by `app.customComponentLifecycle`.
 */

import { useTransition } from 'react';
import { Users } from 'lucide-react';
import { Modal, Alert } from '@/components/ui/molecules';
import { Button, Text } from '@/components/ui/atoms';
import { useToast } from '@/providers/toast-provider';
import { shareCustomComponentAction } from '@/app/actions/custom-components';
import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
  component: GabCustomComponent;
  onShared?: (next: GabCustomComponent) => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  appId,
  component,
  onShared,
}: ShareDialogProps) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const alreadyShared = component.visibility === 'app';

  const onConfirm = () => {
    startTransition(async () => {
      const res = await shareCustomComponentAction(appId, component.key);
      if (res.success && res.data) {
        addToast('Component shared with the app.', 'success');
        onShared?.(res.data);
        onOpenChange(false);
      } else {
        addToast(res.error ?? 'Sharing failed.', 'error');
      }
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={alreadyShared ? 'Already shared' : 'Share with the app?'}
      description={`Component ${component.name} (key: ${component.key})`}
      size="md"
    >
      <div className="space-y-3">
        {alreadyShared ? (
          <Alert variant="info">
            This component is already visible to every editor in the app.
            Share is one-way: convert back to personal by duplicating into
            a new component.
          </Alert>
        ) : (
          <>
            <Text size="sm">
              Sharing makes this component selectable in every page of this
              app. Other editors will see new revisions automatically and
              can&apos;t roll back from outside this editor.
            </Text>
            <Text size="xs" color="muted">
              You can&apos;t un-share. To experiment privately again,
              duplicate the component first.
            </Text>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {alreadyShared ? 'Close' : 'Cancel'}
          </Button>
          {!alreadyShared && (
            <Button
              type="button"
              icon={Users}
              onClick={onConfirm}
              loading={isPending}
            >
              Share with app
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
