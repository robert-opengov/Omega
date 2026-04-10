'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/atoms';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface CheckboxTreeProps {
  items: TreeNode[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  expandedByDefault?: boolean;
  className?: string;
}

function getAllDescendantIds(node: TreeNode): string[] {
  const ids: string[] = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids.push(...getAllDescendantIds(child));
    }
  }
  return ids;
}

function getLeafIds(node: TreeNode): string[] {
  if (!node.children || node.children.length === 0) return [node.id];
  return node.children.flatMap(getLeafIds);
}

type CheckState = 'checked' | 'unchecked' | 'indeterminate';

function getCheckState(node: TreeNode, selectedSet: Set<string>): CheckState {
  if (!node.children || node.children.length === 0) {
    return selectedSet.has(node.id) ? 'checked' : 'unchecked';
  }
  const childStates = node.children.map((c) => getCheckState(c, selectedSet));
  if (childStates.every((s) => s === 'checked')) return 'checked';
  if (childStates.every((s) => s === 'unchecked')) return 'unchecked';
  return 'indeterminate';
}

function TreeNodeItem({
  node,
  selectedSet,
  expanded,
  onToggle,
  onToggleExpand,
  depth,
}: {
  node: TreeNode;
  selectedSet: Set<string>;
  expanded: Set<string>;
  onToggle: (node: TreeNode) => void;
  onToggleExpand: (id: string) => void;
  depth: number;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const state = getCheckState(node, selectedSet);

  return (
    <div>
      <div
        className={cn('flex items-center gap-1 py-1 hover:bg-action-hover rounded transition-colors duration-200')}
        style={{ paddingLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(node.id)}
            className="p-0.5 rounded hover:bg-muted transition-colors duration-200"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight
              className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Checkbox
          checked={state === 'checked'}
          indeterminate={state === 'indeterminate'}
          onCheckedChange={() => onToggle(node)}
          disabled={node.disabled}
        />
        <span className={cn('text-sm text-foreground select-none', node.disabled && 'opacity-50')}>{node.label}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedSet={selectedSet}
              expanded={expanded}
              onToggle={onToggle}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CheckboxTree({
  items,
  selected,
  onSelectionChange,
  expandedByDefault = false,
  className,
}: CheckboxTreeProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const allNodeIds = useMemo(() => {
    const collect = (nodes: TreeNode[]): string[] =>
      nodes.flatMap((n) => [n.id, ...(n.children ? collect(n.children) : [])]);
    return collect(items);
  }, [items]);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(expandedByDefault ? allNodeIds : []),
  );

  const onToggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggle = useCallback(
    (node: TreeNode) => {
      const allIds = getAllDescendantIds(node);
      const state = getCheckState(node, selectedSet);
      const nextSet = new Set(selectedSet);
      if (state === 'checked') {
        allIds.forEach((id) => nextSet.delete(id));
      } else {
        allIds.forEach((id) => nextSet.add(id));
      }
      onSelectionChange(Array.from(nextSet));
    },
    [selectedSet, onSelectionChange],
  );

  return (
    <div className={cn('space-y-0', className)} role="tree">
      {items.map((item) => (
        <TreeNodeItem
          key={item.id}
          node={item}
          selectedSet={selectedSet}
          expanded={expanded}
          onToggle={onToggle}
          onToggleExpand={onToggleExpand}
          depth={0}
        />
      ))}
    </div>
  );
}

export default CheckboxTree;
