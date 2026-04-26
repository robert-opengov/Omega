import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/molecules';
import { resolvePublicFormAction } from '@/app/actions/public-forms';
import { isModuleEnabledNow } from '@/lib/feature-overrides';
import { PublicFormRunner } from './_components/PublicFormRunner';

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // When the unified dispatcher is on, this legacy split route just
  // forwards to `/pub/[token]`. Off → original behavior is preserved
  // exactly so a fork can opt back without a code change.
  if (await isModuleEnabledNow('platform.publicDispatcher')) {
    redirect(`/pub/${token}`);
  }

  const resolved = await resolvePublicFormAction(token);

  if (!resolved.success || !resolved.data) {
    return (
      <EmptyState
        status="warning"
        title="Form not available"
        description={resolved.error ?? 'This public form link is not available.'}
      />
    );
  }

  return (
    <PublicFormRunner
      token={token}
      form={resolved.data.form}
      fields={resolved.data.fields}
      settings={resolved.data.settings}
    />
  );
}
