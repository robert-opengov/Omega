'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  RefreshCw,
  Activity,
  Network,
  Sigma,
  Link2,
  Layers,
  Undo2,
  PackagePlus,
  Gauge,
} from 'lucide-react';
import { Badge, Button, Input, Text } from '@/components/ui/atoms';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Modal,
  Sheet,
} from '@/components/ui/molecules';
import { recomputeAllAction } from '@/app/actions/jobs';
import { getComplexityScoreAction, getDependencyGraphAction } from '@/app/actions/apps';
import {
  extractTemplateFromAppAction,
  getAppSubscriptionAction,
  rollbackTemplateAction,
} from '@/app/actions/templates';
import type { ComplexityScore, DependencyGraph } from '@/lib/core/ports/app.repository';
import { DependencyGraphView } from './DependencyGraphView';

export function AppOverviewActions({ appId }: { appId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [graphOpen, setGraphOpen] = useState(false);
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [complexityOpen, setComplexityOpen] = useState(false);
  const [complexity, setComplexity] = useState<ComplexityScore | null>(null);
  const [complexityLoading, setComplexityLoading] = useState(false);
  const [complexityError, setComplexityError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const openGraph = async () => {
    setGraphOpen(true);
    if (graph) return;
    setGraphLoading(true);
    setGraphError(null);
    const res = await getDependencyGraphAction(appId);
    setGraphLoading(false);
    if (!res.success) {
      setGraphError(res.error);
      return;
    }
    setGraph(res.data);
  };

  const openComplexity = async () => {
    setComplexityOpen(true);
    if (complexity) return;
    setComplexityLoading(true);
    setComplexityError(null);
    const res = await getComplexityScoreAction(appId);
    setComplexityLoading(false);
    if (!res.success) {
      setComplexityError(res.error);
      return;
    }
    setComplexity(res.data);
  };

  const publishAsTemplate = () => {
    setError(null);
    startTransition(async () => {
      const res = await extractTemplateFromAppAction(appId, {
        templateName: templateName.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setPublishOpen(false);
      setTemplateName('');
      router.push(`/templates/${res.data.id}`);
    });
  };

  const rollbackTemplateVersion = () => {
    setError(null);
    startTransition(async () => {
      const subscription = await getAppSubscriptionAction(appId);
      if (!subscription.success) {
        setError(subscription.error ?? 'Failed to load subscription.');
        return;
      }
      if (!subscription.data) {
        setError('This app is not subscribed to a template.');
        return;
      }
      if (subscription.data.appliedVersion <= 1) {
        setError('Already at the earliest applied template version.');
        return;
      }
      const targetVersion = subscription.data.appliedVersion - 1;
      const res = await rollbackTemplateAction(appId, targetVersion);
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const triggerRecompute = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await recomputeAllAction(appId);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setConfirmOpen(false);
      router.push(`/apps/${appId}/jobs`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            More
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openComplexity}>
            <Gauge className="h-4 w-4" />
            Complexity score
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openGraph}>
            <Network className="h-4 w-4" />
            Dependency graph
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/apps/${appId}/sandbox`)}>
            <Layers className="h-4 w-4" />
            Schema diff & promote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPublishOpen(true)}>
            <PackagePlus className="h-4 w-4" />
            Publish as template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={rollbackTemplateVersion}>
            <Undo2 className="h-4 w-4" />
            Template rollback
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
            <RefreshCw className="h-4 w-4" />
            Recompute all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Modal
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setError(null);
        }}
        title="Recompute all computed fields"
        description="This re-evaluates every formula, lookup, and summary field across every record in the app. It can take a while on large apps."
        primaryAction={{
          label: isPending ? 'Recomputing…' : 'Run recompute',
          onClick: triggerRecompute,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setConfirmOpen(false),
        }}
      >
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <Text size="sm">
              Use this after large schema or formula changes. Reads are paused
              for affected tables while recompute runs.
            </Text>
            {error && (
              <Text size="sm" className="text-danger-text">
                {error}
              </Text>
            )}
          </div>
        </div>
      </Modal>

      {result && (
        <Text size="xs" color="muted">{result}</Text>
      )}
      {error && !confirmOpen && (
        <Text size="xs" className="text-danger-text">{error}</Text>
      )}

      <Modal
        open={graphOpen}
        onOpenChange={setGraphOpen}
        title="Compute dependency graph"
        description="Formula, lookup, and summary fields and how they depend on one another."
        size="lg"
      >
        {graphLoading && (
          <Text size="sm" color="muted">Loading dependency graph…</Text>
        )}
        {graphError && (
          <Text size="sm" className="text-danger-text">{graphError}</Text>
        )}
        {graph && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <GraphStat label="Nodes" value={graph.complexity.totalNodes} />
              <GraphStat label="Edges" value={graph.complexity.edgeCount} />
              <GraphStat label="Depth" value={graph.complexity.depth} />
              <GraphStat label="Clusters" value={graph.complexity.clusters} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info" size="sm">
                <Sigma className="h-3 w-3 mr-1" />
                {graph.complexity.formulas} formulas
              </Badge>
              <Badge variant="info" size="sm">
                <Link2 className="h-3 w-3 mr-1" />
                {graph.complexity.lookups} lookups
              </Badge>
              <Badge variant="warning" size="sm">
                <Sigma className="h-3 w-3 mr-1" />
                {graph.complexity.summaries} summaries
              </Badge>
              <Badge
                variant={
                  graph.complexity.level === 'high'
                    ? 'danger'
                    : graph.complexity.level === 'moderate'
                      ? 'warning'
                      : 'success'
                }
                size="sm"
              >
                {graph.complexity.level} complexity ({graph.complexity.score})
              </Badge>
            </div>
            <DependencyGraphView graph={graph} />
            <Text size="xs" color="muted">
              Drag nodes to reposition. Edges flow from a source field to the computed
              field that depends on it.
            </Text>
          </div>
        )}
      </Modal>

      <Sheet
        open={complexityOpen}
        onOpenChange={setComplexityOpen}
        title="Complexity score"
        description="Detailed compute-engine complexity metrics and recommendations."
        side="right"
        size="lg"
      >
        {complexityLoading ? (
          <Text size="sm" color="muted">Loading complexity…</Text>
        ) : complexityError ? (
          <Text size="sm" className="text-danger-text">{complexityError}</Text>
        ) : complexity ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">{complexity.tier}</Badge>
              <Text size="sm" weight="medium">Score {complexity.overallScore}</Text>
            </div>
            <Text size="sm" color="muted">{complexity.tierDescription}</Text>
            <div className="grid grid-cols-2 gap-3">
              <GraphStat label="Schema" value={complexity.subscores.schema.score} />
              <GraphStat label="Computation" value={complexity.subscores.computation.score} />
              <GraphStat label="Topology" value={complexity.subscores.graphTopology.score} />
              <GraphStat label="Volume" value={complexity.subscores.dataVolume.score} />
            </div>
            {complexity.recommendations.length > 0 ? (
              <div className="space-y-2">
                <Text size="sm" weight="semibold">Recommendations</Text>
                <ul className="space-y-2">
                  {complexity.recommendations.slice(0, 5).map((rec, idx) => (
                    <li key={`${rec.title}-${idx}`} className="rounded border border-border p-3">
                      <Text size="sm" weight="medium">{rec.title}</Text>
                      <Text size="xs" color="muted">{rec.description}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <Text size="sm" color="muted">Complexity data unavailable.</Text>
        )}
      </Sheet>

      <Modal
        open={publishOpen}
        onOpenChange={(open) => {
          setPublishOpen(open);
          if (!open) {
            setTemplateName('');
            setError(null);
          }
        }}
        title="Publish as template"
        description="Extract this app schema into a new template."
        primaryAction={{
          label: isPending ? 'Publishing…' : 'Publish',
          onClick: publishAsTemplate,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setPublishOpen(false),
        }}
      >
        <div className="space-y-2">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name (optional)"
            aria-label="Template name"
          />
          <Text size="xs" color="muted">
            If omitted, the current app name is used.
          </Text>
          {error ? <Text size="sm" className="text-danger-text">{error}</Text> : null}
        </div>
      </Modal>
    </div>
  );
}

function GraphStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border p-3">
      <Text size="xs" color="muted">{label}</Text>
      <Text size="lg" weight="semibold">{value}</Text>
    </div>
  );
}
