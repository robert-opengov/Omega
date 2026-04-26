'use client';

/**
 * ComplexityScoreDrawer — full-fat drawer presentation of the App Complexity
 * score (gated by `app.complexityDrawer`).
 *
 * Why a drawer?
 *   The compact modal fallback only shows the score and a single
 *   recommendation. The drawer surfaces every subscore band, every
 *   recommendation, and "what drives each subscore" so an admin can
 *   reason about how to lower complexity without leaving the overview
 *   page.
 *
 * Removal recipe: flip `app.complexityDrawer` off OR delete this file +
 * the conditional in AppOverviewActions.tsx. The data port/adapter is
 * unchanged either way.
 */

import { Badge, Text } from '@/components/ui/atoms';
import { Sheet } from '@/components/ui/molecules';
import type { ComplexityScore } from '@/lib/core/ports/app.repository';
import { cn } from '@/lib/utils';

export interface ComplexityScoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error: string | null;
  complexity: ComplexityScore | null;
}

const TIER_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  simple: 'success',
  moderate: 'info',
  complex: 'warning',
  advanced: 'danger',
};

export function ComplexityScoreDrawer({
  open,
  onOpenChange,
  loading,
  error,
  complexity,
}: ComplexityScoreDrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Complexity score"
      description="Detailed compute-engine complexity metrics and recommendations."
      side="right"
      size="lg"
    >
      {loading ? (
        <Text size="sm" color="muted">Loading complexity…</Text>
      ) : error ? (
        <Text size="sm" className="text-danger-text">{error}</Text>
      ) : complexity ? (
        <div className="space-y-5">
          <header className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={TIER_VARIANT[complexity.tier.toLowerCase()] ?? 'info'}
                size="sm"
              >
                {complexity.tier}
              </Badge>
              <Text size="sm" weight="medium">
                Score {complexity.overallScore}
              </Text>
            </div>
            <Text size="sm" color="muted">{complexity.tierDescription}</Text>
          </header>

          <section className="space-y-2">
            <Text size="sm" weight="semibold">Subscores</Text>
            <div className="grid grid-cols-2 gap-3">
              <SubscoreCard
                label="Schema"
                value={complexity.subscores.schema.score}
              />
              <SubscoreCard
                label="Computation"
                value={complexity.subscores.computation.score}
              />
              <SubscoreCard
                label="Topology"
                value={complexity.subscores.graphTopology.score}
              />
              <SubscoreCard
                label="Data volume"
                value={complexity.subscores.dataVolume.score}
              />
            </div>
          </section>

          {complexity.recommendations.length > 0 && (
            <section className="space-y-2">
              <Text size="sm" weight="semibold">
                Recommendations
              </Text>
              <ul className="space-y-2">
                {complexity.recommendations.map((rec, idx) => (
                  <li
                    key={`${rec.title}-${idx}`}
                    className="rounded border border-border p-3"
                  >
                    <Text size="sm" weight="medium">{rec.title}</Text>
                    <Text size="xs" color="muted">{rec.description}</Text>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <Text size="sm" color="muted">Complexity data unavailable.</Text>
      )}
    </Sheet>
  );
}

function SubscoreCard({ label, value }: { label: string; value: number }) {
  // Color the subscore band so an admin can see at a glance which
  // dimension is pulling the overall score up. Bands match the
  // server-side tier breakpoints used in app.repository.ts.
  const tone =
    value >= 75 ? 'danger' : value >= 50 ? 'warning' : value >= 25 ? 'info' : 'success';
  return (
    <div className="rounded border border-border p-3">
      <Text size="xs" color="muted">{label}</Text>
      <div className="flex items-center gap-2">
        <Text size="lg" weight="semibold">{value}</Text>
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            tone === 'danger' && 'bg-danger',
            tone === 'warning' && 'bg-warning',
            tone === 'info' && 'bg-info',
            tone === 'success' && 'bg-success',
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}
