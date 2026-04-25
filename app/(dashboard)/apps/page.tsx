import { gabAppRepo } from '@/lib/core';
import { AppsCatalog } from './_components/AppsCatalog';

/**
 * GAB application catalog — top-level entry point for the multi-app admin UI.
 *
 * Server Component: fetches the app list once, then hands off to the
 * `AppsCatalog` client component for filtering/creating/copying.
 */
export default async function AppsPage() {
  let initialApps: Awaited<ReturnType<typeof gabAppRepo.listApps>> = { items: [], total: 0 };
  let loadError: string | null = null;

  try {
    initialApps = await gabAppRepo.listApps();
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load apps';
  }

  return (
    <div className="bg-surface-canvas min-h-full">
      <AppsCatalog initialApps={initialApps.items} loadError={loadError} />
    </div>
  );
}
