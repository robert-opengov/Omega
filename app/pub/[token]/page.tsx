import { EmptyState } from '@/components/ui/molecules';
import { Heading, Text } from '@/components/ui/atoms';
import { gabPublicFormRepo } from '@/lib/core';
import { featureGuard } from '@/lib/feature-guards';
import { PageRenderer } from '@/components/_custom/page-builder/PageRenderer';
import { normalizePageLayout } from '@/lib/page-builder/layout-helpers';
import { PublicFormRunner } from '../forms/[token]/_components/PublicFormRunner';

/**
 * Single dispatcher for `/pub/[token]`. Resolves a public link in one
 * round-trip and renders either the public form or public page in place,
 * matching GAB Core's URL scheme. Gated by `platform.publicDispatcher`
 * so a fork can opt back to the split `/pub/forms/[token]` and
 * `/pub/pages/[token]` routes by flipping the flag off.
 */
export default async function PublicDispatcherPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await featureGuard('platform.publicDispatcher');
  const { token } = await params;

  let resolved;
  try {
    resolved = await gabPublicFormRepo.resolvePublicToken(token);
  } catch (err) {
    return (
      <EmptyState
        status="warning"
        title="Link unavailable"
        description={
          err instanceof Error
            ? err.message
            : 'This public link is invalid or has expired.'
        }
      />
    );
  }

  if (resolved.type === 'form') {
    return (
      <PublicFormRunner
        token={token}
        form={resolved.data.form}
        fields={resolved.data.fields}
        settings={resolved.data.settings}
      />
    );
  }

  const layout = normalizePageLayout(resolved.data.page.layout);
  return (
    <div className="space-y-4">
      <div>
        <Heading as="h1" className="text-2xl">
          {resolved.data.page.name}
        </Heading>
        <Text size="sm" color="muted">
          Public page
        </Text>
      </div>
      <PageRenderer layout={layout} appId={resolved.data.appId} />
    </div>
  );
}
