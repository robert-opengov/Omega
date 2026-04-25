'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { Badge, Input, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  DataTable,
  EmptyState,
  Pagination,
  PageHeader,
  type Column,
} from '@/components/ui/molecules';
import type { GabUser } from '@/lib/core/ports/user.repository';

interface UsersPanelProps {
  users: GabUser[];
  total: number;
  page: number;
  pageSize: number;
  tenants: { id: string; name: string }[];
}

export function UsersPanel({
  users,
  total,
  page,
  pageSize,
  tenants,
}: UsersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const tenantId = searchParams.get('tenantId') ?? '';
  const active = searchParams.get('active') ?? '';

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce the search input → URL update
  useEffect(() => {
    if (searchInput === search) return;
    const t = window.setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (searchInput) sp.set('search', searchInput);
      else sp.delete('search');
      sp.set('page', '1');
      router.replace(`?${sp.toString()}`);
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') sp.delete(key);
    else sp.set(key, value);
    sp.set('page', '1');
    router.replace(`?${sp.toString()}`);
  };

  const onPage = (next: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('page', String(next));
    router.replace(`?${sp.toString()}`);
  };

  const onPageSize = (size: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('pageSize', String(size));
    sp.set('page', '1');
    router.replace(`?${sp.toString()}`);
  };

  const tenantNameById = new Map(tenants.map((t) => [t.id, t.name]));

  type Row = GabUser & Record<string, unknown>;

  const columns: Column<Row>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="font-medium text-foreground">{row.email || '—'}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) =>
        [row.firstName, row.lastName].filter(Boolean).join(' ') || (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'tenantId',
      header: 'Company',
      render: (row) =>
        row.tenantId ? (
          <span className="text-xs">
            {tenantNameById.get(row.tenantId) ?? row.tenantId}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) =>
        row.active ? (
          <Badge variant="success" size="sm">
            Active
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            Inactive
          </Badge>
        ),
    },
    {
      key: 'twoFactorEnabled',
      header: '2FA',
      render: (row) =>
        row.twoFactorEnabled ? (
          <Badge variant="info" size="sm">
            On
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Off</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(search || tenantId || active);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Platform-wide user directory. Edit profile fields, status, and 2FA."
        condensed
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="users-search">
                Search
              </label>
              <Input
                id="users-search"
                placeholder="Email or name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="users-tenant">
                Company
              </label>
              <select
                id="users-tenant"
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                value={tenantId}
                onChange={(e) => setParam('tenantId', e.target.value)}
              >
                <option value="">All</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="users-status">
                Status
              </label>
              <select
                id="users-status"
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                value={active}
                onChange={(e) => setParam('active', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Text size="sm" color="muted">
              {total} user{total === 1 ? '' : 's'}
            </Text>
            {hasFilters && (
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  const sp = new URLSearchParams();
                  sp.set('page', '1');
                  router.replace(`?${sp.toString()}`);
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? 'No users match' : 'No users yet'}
              description={
                hasFilters
                  ? 'Try widening the search or clearing filters.'
                  : 'Users created in GAB Core will appear here.'
              }
            />
          ) : (
            <DataTable
              data={users as Row[]}
              columns={columns}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => router.push(`/users/${r.id}`)}
              tableLabel="Users"
              density="compact"
            />
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={onPage}
            onPageSizeChange={onPageSize}
            itemLabel="user"
          />
        </CardContent>
      </Card>
    </div>
  );
}
