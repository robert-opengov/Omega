'use client';

/**
 * SharePageDialog — minimal page-share affordance summoned from the page
 * editor toolbar (gated by the `pageBuilder.pageShare` module flag).
 *
 * Scope is intentionally narrow: type is fixed to `'page'` and `pageKey`
 * is preset, so the surface only exposes name + optional max submissions.
 * Full link management (roles, expiry, listing other links) lives at
 * /apps/[appId]/settings/public-links so we don't grow the toolbar.
 *
 * Removal recipe: flip `pageBuilder.pageShare` off OR delete this file
 * and the Share button block in PageEditorClient. No data deletion.
 */

import { useState, useTransition, useEffect } from 'react';
import { Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button, Label, Text } from '@/components/ui/atoms';
import { Modal, FormField } from '@/components/ui/molecules';
import {
  createPublicLinkAction,
  listPublicLinksAction,
} from '@/app/actions/public-access';
import type { PublicLink } from '@/lib/core/ports/public-access.repository';

export interface SharePageDialogProps {
  appId: string;
  pageKey: string;
  pageName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function publicUrl(token: string): string {
  if (typeof window === 'undefined') return `/pub/${token}`;
  return `${window.location.origin}/pub/${token}`;
}

export function SharePageDialog({
  appId,
  pageKey,
  pageName,
  open,
  onOpenChange,
}: SharePageDialogProps) {
  const [name, setName] = useState(pageName);
  const [maxSubmissions, setMaxSubmissions] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<PublicLink[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [created, setCreated] = useState<PublicLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  // Pre-load any existing links scoped to this page so the user can
  // grab an existing URL instead of accumulating duplicates.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setCreated(null);
    setName(pageName);
    setMaxSubmissions('');
    setLoadingExisting(true);
    listPublicLinksAction(appId)
      .then((res) => {
        if (!res.success) return;
        setExisting(
          res.data.items.filter(
            (l) => l.type === 'page' && l.pageKey === pageKey && l.active,
          ),
        );
      })
      .finally(() => setLoadingExisting(false));
  }, [appId, pageKey, pageName, open]);

  const onCreate = () => {
    setError(null);
    startCreate(async () => {
      const res = await createPublicLinkAction(appId, {
        type: 'page',
        pageKey,
        name: name.trim() || pageName,
        ...(maxSubmissions ? { maxSubmissions: Number(maxSubmissions) } : {}),
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCreated(res.data);
      setExisting((prev) => [res.data, ...prev]);
    });
  };

  const copy = async (link: PublicLink) => {
    try {
      await navigator.clipboard.writeText(publicUrl(link.token));
      setCopiedId(link.id);
      setTimeout(
        () => setCopiedId((curr) => (curr === link.id ? null : curr)),
        1500,
      );
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Share this page"
      description="Generate a public URL anyone with the link can open."
      primaryAction={
        created
          ? { label: 'Done', onClick: () => onOpenChange(false) }
          : {
              label: isCreating ? 'Creating…' : 'Create link',
              onClick: onCreate,
            }
      }
      secondaryAction={
        created ? undefined : { label: 'Cancel', onClick: () => onOpenChange(false) }
      }
    >
      <div className="space-y-4">
        {!created && (
          <>
            <FormField
              label="Link name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={pageName}
            />
            <FormField
              label="Max opens (optional)"
              type="number"
              value={maxSubmissions}
              onChange={(e) => setMaxSubmissions(e.target.value)}
              placeholder="unlimited"
            />
            {error && (
              <Text size="sm" className="text-danger-text">
                {error}
              </Text>
            )}
          </>
        )}

        {created && (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            <Label>Public URL</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs font-mono">
                {publicUrl(created.token)}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copy(created)}
              >
                {copiedId === created.id ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </>
                )}
              </Button>
              <a
                href={publicUrl(created.token)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1.5 text-sm rounded border border-border hover:bg-muted"
                aria-label="Open link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <Text size="xs" color="muted">
              Manage links, roles, and expiry at App settings → Public links.
            </Text>
          </div>
        )}

        {!created && (
          <div className="space-y-2">
            <Label>Existing links for this page</Label>
            {loadingExisting ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
              </div>
            ) : existing.length === 0 ? (
              <Text size="xs" color="muted">
                No active links yet.
              </Text>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {existing.map((link) => (
                  <li
                    key={link.id}
                    className="px-3 py-2 flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">
                        {link.name}
                      </Text>
                      <Text size="xs" color="muted" className="truncate font-mono">
                        {publicUrl(link.token)}
                      </Text>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copy(link)}
                      aria-label="Copy URL"
                    >
                      {copiedId === link.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
