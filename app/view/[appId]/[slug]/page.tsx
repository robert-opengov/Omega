import { notFound } from 'next/navigation';
import { tryGetAppContext } from '@/lib/core/app-context';
import { PageRenderer } from '@/components/_custom/page-builder/PageRenderer';
import { Heading, Text } from '@/components/ui/atoms';
import { Alert } from '@/components/ui/molecules';
import { normalizePageLayout } from '@/lib/page-builder/layout-helpers';
import { checkPageAccess } from '@/lib/page-builder/page-acl';
import { getPageBySlugCached } from '@/lib/page-builder/get-page-by-slug-cached';

export default async function ViewAppPage({
  params,
}: {
  params: Promise<{ appId: string; slug: string }>;
}) {
  const { appId, slug } = await params;
  const ctx = await tryGetAppContext(appId);
  if (!ctx) notFound();

  const page = await getPageBySlugCached(appId, slug);
  if (!page) notFound();

  const access = await checkPageAccess(appId, page);
  if (!access.allowed) {
    return (
      <div className="max-w-md mx-auto pt-12">
        <Alert variant="warning" title="You don't have access to this page">
          {access.reason === 'unauthenticated'
            ? 'Sign in to view this page.'
            : 'Ask an administrator to grant you a role with access.'}
        </Alert>
      </div>
    );
  }

  const layout = normalizePageLayout(page.layout);
  const fullScreen = page.config?.fullScreen === true;

  if (fullScreen) {
    return <PageRenderer layout={layout} appId={appId} />;
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-4">
      <div>
        <Heading as="h1" className="text-2xl">
          {page.name}
        </Heading>
        <Text size="sm" color="muted">
          {ctx.app.name}
        </Text>
      </div>
      <PageRenderer layout={layout} appId={appId} />
    </div>
  );
}
