import { gabPublicFormRepo } from '@/lib/core';
import { PageRenderer } from '@/components/_custom/page-builder/PageRenderer';
import { Heading, Text } from '@/components/ui/atoms';
import { collapseLayoutToOneRow, normalizePageLayout } from '@/lib/page-builder/layout-helpers';
import { PublicPageUnavailable } from './_components/PublicPageUnavailable';

export default async function PublicPageByTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let resolved;
  try {
    resolved = await gabPublicFormRepo.resolvePublicPage(token);
  } catch {
    return <PublicPageUnavailable />;
  }

  const layout = collapseLayoutToOneRow(normalizePageLayout(resolved.page.layout));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Heading as="h1" className="text-2xl">
            {resolved.page.name}
          </Heading>
          <Text size="sm" color="muted">
            Public page
          </Text>
        </div>
        <PageRenderer layout={layout} appId={resolved.appId} />
      </div>
    </div>
  );
}
