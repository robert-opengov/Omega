'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Plus, Trash2, Pencil } from 'lucide-react';
import { Button, Heading, Text } from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Modal,
  PageHeader,
} from '@/components/ui/molecules';
import {
  createDashboardAction,
  deleteDashboardAction,
} from '@/app/actions/dashboards';
import { useToast } from '@/providers/toast-provider';
import type { Dashboard } from '@/lib/core/ports/dashboard.repository';

export interface DashboardsListPanelProps {
  appId: string;
  initialDashboards: Dashboard[];
  initialError: string | null;
}

export function DashboardsListPanel({
  appId,
  initialDashboards,
  initialError,
}: DashboardsListPanelProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [items, setItems] = useState<Dashboard[]>(initialDashboards);
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      const res = await createDashboardAction({
        appId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (!res.success) {
        addToast(`Could not create dashboard: ${res.error}`, 'error');
        return;
      }
      setItems((prev) => [...prev, res.data]);
      setOpenCreate(false);
      setName('');
      setDescription('');
      router.push(`/apps/${appId}/dashboards/${res.data.id}/edit`);
    });
  };

  const remove = (dashboardId: string) => {
    startTransition(async () => {
      const res = await deleteDashboardAction({ appId, dashboardId });
      if (!res.success) {
        addToast(`Delete failed: ${res.error}`, 'error');
        return;
      }
      setItems((prev) => prev.filter((d) => d.id !== dashboardId));
      addToast('Dashboard deleted', 'success');
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboards"
        description="Composable KPI surfaces, built with the page-builder grid."
        actions={
          <Button onClick={() => setOpenCreate(true)} icon={Plus}>
            New dashboard
          </Button>
        }
      />

      {initialError && (
        <Text size="sm" color="destructive">
          {initialError}
        </Text>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No dashboards yet"
          description="Create your first dashboard to compose KPI tiles and charts."
          action={{ label: 'New dashboard', onClick: () => setOpenCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle>{d.name}</CardTitle>
                {d.description && (
                  <Text size="sm" color="muted" className="mt-1">
                    {d.description}
                  </Text>
                )}
              </CardHeader>
              <CardContent className="flex justify-between gap-2 pt-3">
                <Link
                  href={`/apps/${appId}/dashboards/${d.id}/edit`}
                  className="inline-flex items-center gap-2 h-8 px-3 text-sm rounded border border-border bg-background text-foreground hover:bg-action-hover-primary"
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                  Edit
                </Link>
                <div className="flex gap-2">
                  <Link
                    href={`/apps/${appId}/dashboards/${d.id}`}
                    className="inline-flex items-center h-8 px-3 text-sm rounded text-muted-foreground hover:bg-action-hover-primary hover:text-foreground"
                  >
                    Open
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    icon={Trash2}
                    disabled={pending}
                    onClick={() => remove(d.id)}
                    aria-label={`Delete ${d.name}`}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New dashboard"
        description="Name your dashboard. You can edit the layout in the next step."
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="d-name">
              Name
            </label>
            <input
              id="d-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="Quarterly KPIs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="d-desc">
              Description
            </label>
            <input
              id="d-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={pending || name.trim().length === 0}>
              {pending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {pending && items.length > 0 && (
        <Heading as="h2" className="sr-only">
          Updating…
        </Heading>
      )}
    </div>
  );
}
