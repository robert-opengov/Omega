import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Database, Lock, AppWindow } from 'lucide-react';
import { Badge, Heading, Text } from '@/components/ui/atoms';
import { getImpersonationAction } from '@/app/actions/auth';
import { tryGetAppContext } from '@/lib/core/app-context';
import { gabAppRoleRepo, gabUserRepo } from '@/lib/core';
import { isModuleEnabledNow } from '@/lib/feature-overrides';
import { AppTabsNav } from './_components/AppTabsNav';
import { AppSidebarNav } from './_components/AppSidebarNav';
import { ImpersonationBar } from './_components/ImpersonationBar';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const ctx = await tryGetAppContext(appId);

  if (!ctx) notFound();

  const { app, isSandbox, schemaLocked } = ctx;
  const [impersonation, usersRes, rolesRes, sidebarOn] = await Promise.allSettled([
    getImpersonationAction(),
    gabUserRepo.listUsers({ page: 1, pageSize: 100 }),
    gabAppRoleRepo.listRoles(appId),
    isModuleEnabledNow('app.appSidebar'),
  ]);
  const showSidebar = sidebarOn.status === 'fulfilled' && sidebarOn.value === true;
  const users =
    usersRes.status === 'fulfilled'
      ? usersRes.value.items.map((u) => ({
          id: u.id,
          label: `${u.firstName} ${u.lastName}`.trim() || u.email,
        }))
      : [];
  const roles =
    rolesRes.status === 'fulfilled'
      ? rolesRes.value.items.map((r) => ({ id: r.id, label: r.name }))
      : [];
  const initialImpersonation =
    impersonation.status === 'fulfilled' ? impersonation.value : null;

  return (
    <div className="bg-surface-canvas min-h-full">
      <ImpersonationBar
        initialSession={initialImpersonation}
        users={users}
        roles={roles}
      />
      <div className="border-b border-border bg-card">
        <div className="px-6 lg:px-8 pt-6 pb-3">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-2">
            <Link href="/apps" className="hover:text-foreground">
              Apps
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{app.name}</span>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded bg-primary-light flex items-center justify-center shrink-0">
                <AppWindow className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <Heading as="h1" className="text-xl truncate">{app.name}</Heading>
                <Text size="xs" color="muted" className="font-mono">{app.key}</Text>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isSandbox && (
                <Badge variant="warning" size="sm">
                  <Database className="h-3 w-3 mr-1" />
                  Sandbox
                </Badge>
              )}
              {schemaLocked && (
                <Badge variant="default" size="sm">
                  <Lock className="h-3 w-3 mr-1" />
                  Schema locked
                </Badge>
              )}
              {app.timezone && (
                <Badge variant="default" size="sm">{app.timezone}</Badge>
              )}
            </div>
          </div>

          <div className="mt-3">
            <AppTabsNav appId={appId} />
          </div>
        </div>
      </div>

      <div className="flex">
        {showSidebar && <AppSidebarNav appId={appId} />}
        <div className="flex-1 min-w-0 p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
