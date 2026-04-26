import { getModuleFlagSnapshot } from '@/app/actions/feature-flags';
import { ModuleFlagsManager } from './_components/ModuleFlagsManager';

/**
 * Module Flags admin page.
 *
 * Renders a Server Component to fetch the initial snapshot (env baseline
 * + cookie overrides + computed effective state) and hands it to the
 * client manager, which talks to server actions to mutate the cookie.
 *
 * Note: this page is intentionally not gated by `featureGuard()` — the
 * page that controls the kill switches must always be reachable.
 */
export const dynamic = 'force-dynamic';

export default async function ModuleFlagsPage() {
  const snapshot = await getModuleFlagSnapshot();
  return <ModuleFlagsManager initialSnapshot={snapshot} />;
}
