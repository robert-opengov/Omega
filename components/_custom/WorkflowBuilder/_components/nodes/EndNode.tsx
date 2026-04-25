import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from '../../serializer';

export const EndNode = memo(function EndNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={cn(
        'rounded-full border-2 px-4 py-2 flex items-center gap-2 min-w-[120px] shadow-sm bg-muted border-border',
        selected && 'shadow-md ring-2 ring-foreground/30',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !border-0 !w-2.5 !h-2.5" />
      <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {d.label || 'End'}
      </div>
    </div>
  );
});

export default EndNode;
