'use client';

import { useState, useTransition } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Badge, Button, Input, Label, Text } from '@/components/ui/atoms';
import {
  ConfirmDialog,
  Modal,
  FormField,
  Alert,
} from '@/components/ui/molecules';
import {
  createPublicAccessTokenAction,
  deletePublicAccessTokenAction,
  updatePublicAccessTokenAction,
} from '@/app/actions/public-access';
import type { PublicAccessToken } from '@/lib/core/ports/public-access.repository';

interface AccessTokensPanelProps {
  appId: string;
  initialTokens: PublicAccessToken[];
  roles: { id: string; name: string }[];
}

export function AccessTokensPanel({ appId, initialTokens, roles }: AccessTokensPanelProps) {
  const [tokens, setTokens] = useState<PublicAccessToken[]>(initialTokens);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PublicAccessToken | null>(null);
  const [editRole, setEditRole] = useState<PublicAccessToken | null>(null);
  const [editRoleId, setEditRoleId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [revealedToken, setRevealedToken] = useState<PublicAccessToken | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [isCreating, startCreate] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isUpdating, startUpdate] = useTransition();

  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [rateLimit, setRateLimit] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  const reset = () => {
    setName('');
    setRoleId('');
    setRateLimit('');
    setExpiresAt('');
  };

  const onCreate = () => {
    setError(null);
    startCreate(async () => {
      const res = await createPublicAccessTokenAction(appId, {
        name,
        ...(roleId ? { roleId } : {}),
        ...(rateLimit ? { rateLimit: Number(rateLimit) } : {}),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setTokens((prev) => [res.data, ...prev]);
      setRevealedToken(res.data);
      setShowSecret(false);
      setCopiedSecret(false);
      setCreateOpen(false);
      reset();
    });
  };

  const onDelete = (token: PublicAccessToken) => {
    setError(null);
    startDelete(async () => {
      const res = await deletePublicAccessTokenAction(appId, token.id);
      if (!res.success) {
        setError(res.error);
        setConfirmDelete(null);
        return;
      }
      setTokens((prev) => prev.filter((t) => t.id !== token.id));
      setConfirmDelete(null);
    });
  };

  const onUpdateRole = () => {
    if (!editRole) return;
    setError(null);
    startUpdate(async () => {
      const res = await updatePublicAccessTokenAction(appId, editRole.id, {
        roleId: editRoleId || null,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setTokens((prev) => prev.map((t) => (t.id === editRole.id ? res.data : t)));
      setEditRole(null);
    });
  };

  const copySecret = async () => {
    if (!revealedToken?.token) return;
    try {
      await navigator.clipboard.writeText(revealedToken.token);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text size="sm" color="muted">{tokens.length} token{tokens.length === 1 ? '' : 's'}</Text>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New token
        </Button>
      </div>

      {error && <Text size="sm" className="text-danger-text">{error}</Text>}

      {tokens.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
          <Text size="sm" color="muted">No tokens yet.</Text>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md">
          {tokens.map((token) => (
            <li key={token.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Text size="sm" weight="medium">{token.name}</Text>
                  <Badge variant={token.active ? 'success' : 'danger'} size="sm">
                    {token.active ? 'Active' : 'Revoked'}
                  </Badge>
                  {token.roleName && (
                    <Badge variant="default" size="sm">role: {token.roleName}</Badge>
                  )}
                </div>
                <Text size="xs" color="muted" className="font-mono truncate">
                  {token.token || '••••••••••••••'}
                </Text>
                <Text size="xs" color="muted" className="mt-0.5">
                  Created {new Date(token.createdAt).toLocaleString()}
                  {token.expiresAt && ` · expires ${new Date(token.expiresAt).toLocaleString()}`}
                  {token.rateLimit && ` · ${token.rateLimit} req/min`}
                </Text>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditRole(token);
                    setEditRoleId(token.roleId ?? '');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Change role
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(token)}
                  aria-label="Revoke token"
                >
                  <Trash2 className="h-4 w-4 text-danger-text" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            reset();
            setError(null);
          }
        }}
        title="Create access token"
        primaryAction={{
          label: isCreating ? 'Creating…' : 'Create',
          onClick: onCreate,
        }}
        secondaryAction={{ label: 'Cancel', onClick: () => setCreateOpen(false) }}
      >
        <div className="space-y-3">
          <FormField
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CI integration"
          />
          <div className="space-y-1.5">
            <Label htmlFor="token-role">Role (optional)</Label>
            <select
              id="token-role"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">(none — public)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Rate limit (req/min, optional)"
            type="number"
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value)}
            placeholder="unlimited"
          />
          <div className="space-y-1.5">
            <Label htmlFor="token-expires">Expires at (optional)</Label>
            <Input
              id="token-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          {error && <Text size="sm" className="text-danger-text">{error}</Text>}
        </div>
      </Modal>

      <Modal
        open={revealedToken !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevealedToken(null);
            setShowSecret(false);
            setCopiedSecret(false);
          }
        }}
        title="Token created"
        size="lg"
        primaryAction={{
          label: 'Done',
          onClick: () => setRevealedToken(null),
        }}
      >
        <div className="space-y-3">
          <Alert variant="warning" title="Save this secret now">
            The full token is shown only once. After closing this dialog the value will be hidden.
          </Alert>
          <div className="flex items-center gap-2 p-3 bg-muted rounded font-mono text-sm break-all">
            <span className="flex-1">
              {showSecret ? revealedToken?.token : '•'.repeat(revealedToken?.token.length ?? 32)}
            </span>
            <button
              onClick={() => setShowSecret((v) => !v)}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label={showSecret ? 'Hide secret' : 'Reveal secret'}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={copySecret}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="Copy secret"
            >
              {copiedSecret ? <Check className="h-4 w-4 text-success-text" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editRole !== null}
        onOpenChange={(open) => !open && setEditRole(null)}
        title={`Change role for "${editRole?.name}"`}
        primaryAction={{
          label: isUpdating ? 'Saving…' : 'Save',
          onClick: onUpdateRole,
        }}
        secondaryAction={{ label: 'Cancel', onClick: () => setEditRole(null) }}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Role</Label>
            <select
              id="edit-role"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              value={editRoleId}
              onChange={(e) => setEditRoleId(e.target.value)}
            >
              <option value="">(none — public)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          {error && <Text size="sm" className="text-danger-text">{error}</Text>}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        variant="danger"
        title={`Revoke "${confirmDelete?.name}"?`}
        description="The token will stop working immediately. This cannot be undone."
        confirmLabel={isDeleting ? 'Revoking…' : 'Revoke'}
        loading={isDeleting}
        onConfirm={() => confirmDelete && onDelete(confirmDelete)}
      />
    </div>
  );
}
