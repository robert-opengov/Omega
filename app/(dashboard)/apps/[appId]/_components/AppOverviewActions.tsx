'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, Activity, Network, Sigma, Link2 } from 'lucide-react';
import { Badge, Button, Text } from '@/components/ui/atoms';
import { Modal } from '@/components/ui/molecules';
import { recomputeAllAction } from '@/app/actions/tables';
import { getDependencyGraphAction } from '@/app/actions/apps';
import type { DependencyGraph } from '@/lib/core/ports/app.repository';
import { DependencyGraphView } from './DependencyGraphView';

export function AppOverviewActions({ appId }: { appId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [graphOpen, setGraphOpen] = useState(false);
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

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

  const triggerRecompute = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await recomputeAllAction(appId);
      if (!res.success) {
        setError(res.error);
        return;
      }
      // The endpoint may return either an immediate summary or an async progress
      // handle. Show whichever shape we got back.
      const data = res.data;
      if ('status' in data) {
        setResult(`Status: ${data.status} (${data.tablesCompleted}/${data.totalTables} tables)`);
      } else {
        setResult(`Recomputed ${data.records} records across ${data.tables} tables.`);
      }
      setConfirmOpen(false);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={openGraph}>
        <Network className="h-3.5 w-3.5 mr-1.5" />
        Dependency graph
      </Button>
      <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Recompute all
      </Button>

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
