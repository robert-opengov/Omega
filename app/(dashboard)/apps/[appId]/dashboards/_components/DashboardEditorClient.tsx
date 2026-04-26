'use client';

import { PageEditorClient } from '@/components/_custom/page-builder/PageEditorClient';
import type { GabPage, PageLayout } from '@/lib/core/ports/pages.repository';
import type { Dashboard } from '@/lib/core/ports/dashboard.repository';
import type { GabCustomComponent } from '@/lib/core/ports/custom-components.repository';
import { updateDashboardAction } from '@/app/actions/dashboards';

export interface DashboardEditorClientProps {
  appId: string;
  dashboard: Dashboard;
  customComponents?: GabCustomComponent[];
}

/**
 * Thin wrapper that adapts a `Dashboard` into the shape `PageEditorClient`
 * expects so the same editor stack (palette, properties, undo/redo, dnd)
 * can persist to the dashboard repository instead of the pages one.
 *
 * The editor's page-only tools (Share, Convert-to-Component) are hidden
 * because they reference `page.key` semantics that don't apply to
 * dashboards. Removing the dashboards feature later is one folder + one
 * port deletion: this file falls away with no impact on PageEditorClient.
 */
export function DashboardEditorClient({
  appId,
  dashboard,
  customComponents,
}: DashboardEditorClientProps) {
  const adapted: GabPage = {
    id: dashboard.id,
    key: dashboard.key,
    name: dashboard.name,
    slug: dashboard.description ?? '',
    icon: null,
    layout: dashboard.layout,
    config: {},
    createdAt: dashboard.createdAt ?? new Date().toISOString(),
    updatedAt: dashboard.updatedAt ?? new Date().toISOString(),
  };

  const handleSave = async (
    layout: PageLayout,
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await updateDashboardAction({
      appId,
      dashboardId: dashboard.id,
      patch: { layout },
    });
    if (res.success) return { success: true };
    return { success: false, error: res.error };
  };

  return (
    <PageEditorClient
      appId={appId}
      page={adapted}
      customComponents={customComponents}
      onSave={handleSave}
      hidePageOnlyTools
    />
  );
}
