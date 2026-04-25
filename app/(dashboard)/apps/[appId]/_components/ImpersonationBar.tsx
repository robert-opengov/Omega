'use client';

import { useState, useTransition } from 'react';
import { UserRoundCog } from 'lucide-react';
import { Button, Select, Text } from '@/components/ui/atoms';
import {
  startImpersonationAction,
  stopImpersonationAction,
  type ImpersonationSession,
} from '@/app/actions/auth';

interface Option {
  id: string;
  label: string;
}

interface ImpersonationBarProps {
  initialSession: ImpersonationSession | null;
  users: Option[];
  roles: Option[];
}

export function ImpersonationBar({
  initialSession,
  users,
  roles,
}: Readonly<ImpersonationBarProps>) {
  const [session, setSession] = useState(initialSession);
  const [userId, setUserId] = useState(initialSession?.userId ?? users[0]?.id ?? '');
  const [roleId, setRoleId] = useState(initialSession?.roleId ?? roles[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activate = () => {
    setError(null);
    startTransition(async () => {
      const res = await startImpersonationAction(userId, roleId);
      if (!res.success || !res.data) {
        setError(res.error ?? 'Failed to start impersonation.');
        return;
      }
      setSession(res.data);
    });
  };

  const stop = () => {
    setError(null);
    startTransition(async () => {
      await stopImpersonationAction();
      setSession(null);
    });
  };

  return (
    <div className="border-b border-warning-light-border bg-warning-light px-6 py-2 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-warning-text">
          <UserRoundCog className="h-4 w-4" />
          <Text size="sm" weight="medium" className="text-warning-text">
            Impersonation
          </Text>
        </span>
        <Select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={isPending}
          aria-label="Impersonated user"
          className="max-w-[260px] bg-card"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.label}
            </option>
          ))}
        </Select>
        <Select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          disabled={isPending}
          aria-label="Impersonated role"
          className="max-w-[220px] bg-card"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || !userId || !roleId}
          onClick={activate}
        >
          {isPending ? 'Applying…' : 'Impersonate'}
        </Button>
        {session ? (
          <>
            <Text size="xs" className="text-warning-text">
              Active as {session.userId} ({session.roleId})
            </Text>
            <Button type="button" variant="danger" size="sm" onClick={stop} disabled={isPending}>
              Stop
            </Button>
          </>
        ) : null}
        {error ? (
          <Text size="xs" className="text-danger-text">
            {error}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
