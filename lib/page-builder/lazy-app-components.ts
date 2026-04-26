/**
 * Lazy registry for vertical / domain-specific page-builder widgets.
 *
 * Mirrors GAB Core's `lazyAppComponents.ts` but is gated end-to-end by
 * the `pageBuilder.verticalWidgets` master flag — when the flag is OFF
 * the loaders are still available (so stored layouts don't crash) but
 * the palette omits every entry and `register-builtins` skips listing
 * them as insertable.
 *
 * Each loader uses dynamic `import()` so the widget JS only ships when
 * a page actually renders that widget type.
 *
 * To add or remove widgets, edit this map + the matching definition in
 * `register-builtins.ts`. The `ModulePath` union forces the rest of
 * the system to follow.
 */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface LazyWidgetProps {
  appId: string;
  props: Record<string, unknown>;
  dataBinding?: unknown;
}

type LazyComp = LazyExoticComponent<ComponentType<LazyWidgetProps>>;

const cache = new Map<string, LazyComp>();

const loaders: Record<string, () => Promise<{ default: ComponentType<LazyWidgetProps> }>> = {
  // The base palette already ships a simple bound `gantt-chart`; the vertical
  // pack publishes a richer schedule widget under `vertical-gantt` to avoid a
  // type collision while still mirroring GAB Core's intent (a domain-aware
  // Gantt with dependencies and milestones).
  'vertical-gantt': () =>
    import('@/components/_custom/page-builder/widgets/GanttChartWidget').then((m) => ({
      default: m.GanttChartWidget,
    })),
  'cash-flow-chart': () =>
    import('@/components/_custom/page-builder/widgets/CashFlowChartWidget').then((m) => ({
      default: m.CashFlowChartWidget,
    })),
  'budget-waterfall': () =>
    import('@/components/_custom/page-builder/widgets/BudgetWaterfallWidget').then((m) => ({
      default: m.BudgetWaterfallWidget,
    })),
  'earned-value-chart': () =>
    import('@/components/_custom/page-builder/widgets/EarnedValueChartWidget').then((m) => ({
      default: m.EarnedValueChartWidget,
    })),
  'risk-matrix': () =>
    import('@/components/_custom/page-builder/widgets/RiskMatrixWidget').then((m) => ({
      default: m.RiskMatrixWidget,
    })),
  'portfolio-bubble': () =>
    import('@/components/_custom/page-builder/widgets/PortfolioBubbleWidget').then((m) => ({
      default: m.PortfolioBubbleWidget,
    })),
  'funding-treemap': () =>
    import('@/components/_custom/page-builder/widgets/FundingTreemapWidget').then((m) => ({
      default: m.FundingTreemapWidget,
    })),
  'health-scorecard': () =>
    import('@/components/_custom/page-builder/widgets/HealthScorecardWidget').then((m) => ({
      default: m.HealthScorecardWidget,
    })),
  'kpi-sparkline': () =>
    import('@/components/_custom/page-builder/widgets/KpiSparklineWidget').then((m) => ({
      default: m.KpiSparklineWidget,
    })),
  'commitment-tracker': () =>
    import('@/components/_custom/page-builder/widgets/CommitmentTrackerWidget').then((m) => ({
      default: m.CommitmentTrackerWidget,
    })),
  'aia-payment-application': () =>
    import('@/components/_custom/page-builder/widgets/AiaPaymentApplicationWidget').then((m) => ({
      default: m.AiaPaymentApplicationWidget,
    })),
  'document-manager': () =>
    import('@/components/_custom/page-builder/widgets/DocumentManagerWidget').then((m) => ({
      default: m.DocumentManagerWidget,
    })),
  'budget-worksheet': () =>
    import('@/components/_custom/page-builder/widgets/BudgetWorksheetWidget').then((m) => ({
      default: m.BudgetWorksheetWidget,
    })),
  'five-year-cip-overview': () =>
    import('@/components/_custom/page-builder/widgets/FiveYearCipOverviewWidget').then((m) => ({
      default: m.FiveYearCipOverviewWidget,
    })),
  'project-cost-profile': () =>
    import('@/components/_custom/page-builder/widgets/ProjectCostProfileWidget').then((m) => ({
      default: m.ProjectCostProfileWidget,
    })),
  'invoice-tracker': () =>
    import('@/components/_custom/page-builder/widgets/InvoiceTrackerWidget').then((m) => ({
      default: m.InvoiceTrackerWidget,
    })),
  'broadband-map': () =>
    import('@/components/_custom/page-builder/widgets/BroadbandMapWidget').then((m) => ({
      default: m.BroadbandMapWidget,
    })),
  'project-editor-tabs': () =>
    import('@/components/_custom/page-builder/widgets/ProjectEditorTabsWidget').then((m) => ({
      default: m.ProjectEditorTabsWidget,
    })),
  'needs-attention': () =>
    import('@/components/_custom/page-builder/widgets/NeedsAttentionWidget').then((m) => ({
      default: m.NeedsAttentionWidget,
    })),
  'version-comparison': () =>
    import('@/components/_custom/page-builder/widgets/VersionComparisonWidget').then((m) => ({
      default: m.VersionComparisonWidget,
    })),
  'budget-change-manager': () =>
    import('@/components/_custom/page-builder/widgets/BudgetChangeManagerWidget').then((m) => ({
      default: m.BudgetChangeManagerWidget,
    })),
  'dept-submission-tracker': () =>
    import('@/components/_custom/page-builder/widgets/DepartmentSubmissionTrackerWidget').then((m) => ({
      default: m.DepartmentSubmissionTrackerWidget,
    })),
};

/**
 * Returns a React.lazy wrapper for an app-specific widget. Results are
 * cached so each type produces a single stable component reference
 * (required by React reconciliation). Returns `undefined` for types
 * not registered as lazy widgets — the caller should fall back to its
 * default block resolver.
 */
export function getLazyAppComponent(type: string): LazyComp | undefined {
  if (cache.has(type)) return cache.get(type)!;
  const loader = loaders[type];
  if (!loader) return undefined;
  const component = lazy(loader);
  cache.set(type, component);
  return component;
}

/** All registered lazy widget type strings (used by tests and the palette). */
export function listLazyAppComponentTypes(): string[] {
  return Object.keys(loaders);
}
