'use client';

/**
 * DiffViewer — minimal line-based unified diff renderer.
 *
 * Used by VersionsDialog to compare an older `codeHistory` snapshot
 * against the live source. Implementation uses an LCS scan so we don't
 * need a runtime dependency on react-diff-view / diff-match-patch.
 *
 * Lives under the `app.customComponentLifecycle` flag — when the flag
 * is OFF, the editor never imports this module.
 */

import { useMemo } from 'react';
import { Text } from '@/components/ui/atoms';
import { cn } from '@/lib/utils';

type Op = 'eq' | 'add' | 'del';

interface DiffLine {
  op: Op;
  text: string;
  /** 1-based; null on the missing side. */
  before: number | null;
  after: number | null;
}

function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function buildDiff(beforeText: string, afterText: string): DiffLine[] {
  const a = beforeText.split('\n');
  const b = afterText.split('\n');
  const dp = lcsTable(a, b);
  const out: DiffLine[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.unshift({ op: 'eq', text: a[i - 1], before: i, after: j });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.unshift({ op: 'del', text: a[i - 1], before: i, after: null });
      i -= 1;
    } else {
      out.unshift({ op: 'add', text: b[j - 1], before: null, after: j });
      j -= 1;
    }
  }
  while (i > 0) {
    out.unshift({ op: 'del', text: a[i - 1], before: i, after: null });
    i -= 1;
  }
  while (j > 0) {
    out.unshift({ op: 'add', text: b[j - 1], before: null, after: j });
    j -= 1;
  }
  return out;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

export function diffStats(before: string, after: string): DiffStats {
  const lines = buildDiff(before, after);
  return lines.reduce<DiffStats>(
    (acc, l) => {
      if (l.op === 'add') acc.additions += 1;
      else if (l.op === 'del') acc.deletions += 1;
      else acc.unchanged += 1;
      return acc;
    },
    { additions: 0, deletions: 0, unchanged: 0 },
  );
}

export interface DiffViewerProps {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Hide identical lines further than `context` away from a change. */
  context?: number;
}

export function DiffViewer({
  before,
  after,
  beforeLabel = 'Old',
  afterLabel = 'New',
  context = 3,
}: DiffViewerProps) {
  const { rows, stats } = useMemo(() => {
    const all = buildDiff(before, after);
    const keep = new Array(all.length).fill(false);
    for (let k = 0; k < all.length; k += 1) {
      if (all[k].op !== 'eq') {
        for (let m = Math.max(0, k - context); m <= Math.min(all.length - 1, k + context); m += 1) {
          keep[m] = true;
        }
      }
    }
    const rows: Array<DiffLine | { op: 'gap' }> = [];
    let lastKept = false;
    for (let k = 0; k < all.length; k += 1) {
      if (keep[k]) {
        rows.push(all[k]);
        lastKept = true;
      } else if (lastKept) {
        rows.push({ op: 'gap' });
        lastKept = false;
      }
    }
    return { rows, stats: diffStats(before, after) };
  }, [before, after, context]);

  if (before === after) {
    return (
      <Text size="sm" color="muted">
        No differences.
      </Text>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">
          {beforeLabel} → {afterLabel}
        </span>
        <span className="text-success-text">+{stats.additions}</span>
        <span className="text-danger-text">-{stats.deletions}</span>
      </div>
      <pre className="font-mono text-[11px] leading-snug border border-border rounded overflow-x-auto bg-muted/40">
        <code className="block">
          {rows.map((row, idx) => {
            if (row.op === 'gap') {
              return (
                <div
                  key={`gap-${idx}`}
                  className="px-2 py-0.5 text-muted-foreground bg-muted/60 select-none"
                >
                  …
                </div>
              );
            }
            return (
              <div
                key={`row-${idx}`}
                className={cn(
                  'flex items-start gap-2 px-2',
                  row.op === 'add' && 'bg-success-light',
                  row.op === 'del' && 'bg-danger-light',
                )}
              >
                <span className="w-6 text-right text-muted-foreground select-none shrink-0">
                  {row.before ?? ''}
                </span>
                <span className="w-6 text-right text-muted-foreground select-none shrink-0">
                  {row.after ?? ''}
                </span>
                <span className="w-3 select-none shrink-0">
                  {row.op === 'add' ? '+' : row.op === 'del' ? '-' : ' '}
                </span>
                <span className="whitespace-pre-wrap break-all">
                  {row.text || ' '}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
