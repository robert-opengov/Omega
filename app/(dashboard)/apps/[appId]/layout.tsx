import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Database, Lock, AppWindow } from 'lucide-react';
import { Badge, Heading, Text } from '@/components/ui/atoms';
import { tryGetAppContext } from '@/lib/core/app-context';
import { AppTabsNav } from './_components/AppTabsNav';

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

  return (
    <div className="bg-surface-canvas min-h-full">
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

      <div className="p-6 lg:p-8">{children}</div>
    </div>
  );
}
