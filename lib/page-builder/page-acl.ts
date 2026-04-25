/**
 * Server-side guard for per-page role-based access control.
 *
 * The page editor lets authors attach `config.rolesAllowed` to each page.
 * Public runtime routes (`/apps/[appId]/p/[slug]`, `/view/[appId]/[slug]`)
 * call `assertPageAccess` after loading the page; the helper resolves the
 * caller's app-scoped role assignments via `gabAppRoleRepo.listUserRoles`
 * and either returns the (possibly normalized) page or signals a deny.
 *
 * The helper is intentionally permissive on errors — we'd rather render the
 * page than 500 the runtime if the role lookup fails. Authors can lock down
 * pages explicitly in `rolesAllowed`; admins always pass.
 */

import { gabAppRoleRepo, authPort } from '@/lib/core';
import type { GabPage } from '@/lib/core/ports/pages.repository';

export type PageAccessResult =
  | { allowed: true; page: GabPage }
  | { allowed: false; reason: 'unauthenticated' | 'forbidden'; page: GabPage };

export async function checkPageAccess(
  appId: string,
  page: GabPage,
): Promise<PageAccessResult> {
  const allowed = page.config?.rolesAllowed?.filter(Boolean) ?? [];

  // Public pages bypass the guard entirely.
  if (page.config?.isPublic) return { allowed: true, page };

  // No allow-list set => any authorized app viewer can see the page.
  if (allowed.length === 0) return { allowed: true, page };

  let token: string | null = null;
  try {
    token = await authPort.getToken();
  } catch {
    // Treat fetch failure the same as "not signed in".
  }
  if (!token) {
    return { allowed: false, reason: 'unauthenticated', page };
  }

  let userId: string | undefined;
  let isAdmin = false;
  try {
    const profile = await authPort.getProfile(token);
    userId = profile.id;
    isAdmin = profile.isAdmin;
  } catch {
    // If we can't read the profile, fail-closed since the page asked for
    // explicit roles.
    return { allowed: false, reason: 'forbidden', page };
  }

  if (isAdmin) return { allowed: true, page };

  if (!userId) return { allowed: false, reason: 'forbidden', page };

  let roleSlugs: string[] = [];
  try {
    const list = await gabAppRoleRepo.listUserRoles(appId, userId);
    roleSlugs = list.items.flatMap((a) => slugsForAssignment(a));
  } catch {
    // Don't leak details — be conservative and deny.
    return { allowed: false, reason: 'forbidden', page };
  }

  const hit = allowed.some((slug) => roleSlugs.includes(slug));
  return hit
    ? { allowed: true, page }
    : { allowed: false, reason: 'forbidden', page };
}

function slugsForAssignment(a: unknown): string[] {
  // `UserRoleAssignment` shape varies across adapters; we normalize a few
  // common variants here so the guard isn't tied to any one of them.
  const r = a as Record<string, unknown>;
  const out: string[] = [];
  const candidates = [
    r.roleSlug,
    r.slug,
    r.roleKey,
    r.key,
    r.name,
    r.roleName,
    r.roleId,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c) out.push(c);
  }
  return out;
}
