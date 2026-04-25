'use client';

import { useState, useTransition } from 'react';
import { Copy, Plus, Trash2, ExternalLink, Check } from 'lucide-react';
import { Badge, Button, Input, Label, Text } from '@/components/ui/atoms';
import {
  ConfirmDialog,
  Modal,
  FormField,
} from '@/components/ui/molecules';
import {
  createPublicLinkAction,
  deletePublicLinkAction,
} from '@/app/actions/public-access';
import type { PublicLink } from '@/lib/core/ports/public-access.repository';

interface PublicLinksPanelProps {
  appId: string;
  initialLinks: PublicLink[];
  roles: { id: string; name: string }[];
}

function statusOf(link: PublicLink): { label: string; color: 'success' | 'danger' | 'warning' | 'default' } {
  if (!link.active) return { label: 'Revoked', color: 'danger' };
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    return { label: 'Expired', color: 'warning' };
  }
  if (link.maxSubmissions && link.submissionCount >= link.maxSubmissions) {
    return { label: 'Max reached', color: 'warning' };
  }
  return { label: 'Active', color: 'success' };
}

function publicUrl(token: string): string {
  if (typeof window === 'undefined') return `/pub/${token}`;
  return `${window.location.origin}/pub/${token}`;
}

export function PublicLinksPanel({ appId, initialLinks, roles }: PublicLinksPanelProps) {
  const [links, setLinks] = useState<PublicLink[]>(initialLinks);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PublicLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  // Create form state
  const [formType, setFormType] = useState<'form' | 'page'>('form');
  const [formName, setFormName] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formRoleId, setFormRoleId] = useState<string>('');
  const [formMax, setFormMax] = useState<string>('');

  const resetCreateForm = () => {
    setFormType('form');
    setFormName('');
    setFormKey('');
    setFormRoleId('');
    setFormMax('');
  };

  const onCreate = () => {
    setError(null);
    startCreate(async () => {
      const res = await createPublicLinkAction(appId, {
        type: formType,
        name: formName,
        ...(formType === 'form' ? { formKey } : { pageKey: formKey }),
        ...(formRoleId ? { roleId: formRoleId } : {}),
        ...(formMax ? { maxSubmissions: Number(formMax) } : {}),
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setLinks((prev) => [res.data, ...prev]);
      setCreateOpen(false);
      resetCreateForm();
    });
  };

  const onDelete = (link: PublicLink) => {
    setError(null);
    startDelete(async () => {
      const res = await deletePublicLinkAction(appId, link.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDelete(null);
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
      setConfirmDelete(null);
    });
  };

  const copy = async (link: PublicLink) => {
    try {
      await navigator.clipboard.writeText(publicUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId((curr) => (curr === link.id ? null : curr)), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text size="sm" color="muted">{links.length} link{links.length === 1 ? '' : 's'}</Text>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New link
        </Button>
      </div>

      {error && (
        <Text size="sm" className="text-danger-text">{error}</Text>
      )}

      {links.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
          <Text size="sm" color="muted">No public links yet.</Text>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md">
          {links.map((link) => {
            const status = statusOf(link);
            return (
              <li key={link.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Text size="sm" weight="medium">{link.name}</Text>
                    <Badge variant="default" size="sm">{link.type}</Badge>
                    <Badge variant={status.color} size="sm">{status.label}</Badge>
                    {link.roleName && (
                      <Badge variant="default" size="sm">role: {link.roleName}</Badge>
                    )}
                  </div>
                  <Text size="xs" color="muted" className="font-mono truncate">
                    {publicUrl(link.token)}
                  </Text>
                  <Text size="xs" color="muted" className="mt-0.5">
                    {link.submissionCount}
                    {link.maxSubmissions ? ` / ${link.maxSubmissions}` : ''} submission{link.submissionCount === 1 ? '' : 's'}
                    {link.expiresAt && ` · expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                  </Text>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copy(link)}
                    aria-label="Copy URL"
                  >
                    {copiedId === link.id ? (
                      <><Check className="h-4 w-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-1" /> Copy</>
                    )}
                  </Button>
                  <a
                    href={publicUrl(link.token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1.5 text-sm rounded border border-border hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(link)}
                    aria-label="Revoke link"
                  >
                    <Trash2 className="h-4 w-4 text-danger-text" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            resetCreateForm();
            setError(null);
          }
        }}
        title="Create public link"
        primaryAction={{
          label: isCreating ? 'Creating…' : 'Create',
          onClick: onCreate,
        }}
        secondaryAction={{ label: 'Cancel', onClick: () => setCreateOpen(false) }}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="link-type">Type</Label>
            <select
              id="link-type"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              value={formType}
              onChange={(e) => setFormType(e.target.value as 'form' | 'page')}
            >
              <option value="form">Form</option>
              <option value="page">Page</option>
            </select>
          </div>
          <FormField
            label="Name"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Contact us"
          />
          <FormField
            label={formType === 'form' ? 'Form key' : 'Page key'}
            required
            value={formKey}
            onChange={(e) => setFormKey(e.target.value)}
            placeholder={formType === 'form' ? 'contact_form' : 'landing_page'}
          />
          <div className="space-y-1.5">
            <Label htmlFor="link-role">Role (optional)</Label>
            <select
              id="link-role"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              value={formRoleId}
              onChange={(e) => setFormRoleId(e.target.value)}
            >
              <option value="">(none)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Max submissions (optional)"
            type="number"
            value={formMax}
            onChange={(e) => setFormMax(e.target.value)}
            placeholder="unlimited"
          />
          {error && <Text size="sm" className="text-danger-text">{error}</Text>}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        variant="danger"
        title={`Revoke "${confirmDelete?.name}"?`}
        description="The link will stop working immediately. This cannot be undone."
        confirmLabel={isDeleting ? 'Revoking…' : 'Revoke'}
        loading={isDeleting}
        onConfirm={() => confirmDelete && onDelete(confirmDelete)}
      />
    </div>
  );
}
