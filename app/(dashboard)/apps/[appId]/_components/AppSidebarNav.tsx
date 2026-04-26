/**
 * Per-app sidebar nav (server component).
 *
 * Coexists with `AppTabsNav` — when both `app.appSidebar` and the relevant
 * tabs are enabled, the layout renders the sidebar AND the tabs. The
 * sidebar is page-driven (one entry per `gabPageRepo.listPages` result)
 * and applies role filtering using the active impersonation role plus
 * each page's `rolesAllowed` config.
 *
 * Rendered as a Server Component so the page list is fetched server-side
 * and the client never sees a list of hidden pages.
 */

import { gabPageRepo } from '@/lib/core';
import { getImpersonationAction } from '@/app/actions/auth';
import { AppSidebarNavClient, type SidebarPageItem } from './AppSidebarNavClient';
import { AppSidebarFallback } from './AppSidebarFallback';

interface AppSidebarNavProps {
  appId: string;
}

function pageVisibleToRole(rolesAllowed: unknown, currentRoleId?: string | null): boolean {
  if (!Array.isArray(rolesAllowed) || rolesAllowed.length === 0) return true;
  if (!currentRoleId) return true;
  return rolesAllowed.includes(currentRoleId);
}

export async function AppSidebarNav({ appId }: AppSidebarNavProps) {
  let pages: SidebarPageItem[] = [];
  try {
    const [list, impersonation] = await Promise.all([
      gabPageRepo.listPages(appId),
      getImpersonationAction(),
    ]);
    const roleId = impersonation?.roleId ?? null;
    pages = list.items
      .filter((p) =>
        pageVisibleToRole(
          (p.config as Record<string, unknown> | undefined)?.rolesAllowed,
          roleId,
        ),
      )
      .map((p) => ({
        key: p.key,
        slug: p.slug,
        name: p.name,
        icon: p.icon,
      }));
  } catch {
    return <AppSidebarFallback message="Could not load pages." />;
  }

  return <AppSidebarNavClient appId={appId} pages={pages} />;
}
