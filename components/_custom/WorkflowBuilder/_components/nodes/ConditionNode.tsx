import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from '../../serializer';

export const ConditionNode = memo(function ConditionNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div className="relative" style={{ width: 180, height: 80 }}>
      <Handle type="target" position={Position.Top} className="!bg-info-text !border-0 !w-2.5 !h-2.5" />
      <div
        className={cn(
          'absolute inset-0 border-2 rounded bg-info-light border-info-text shadow-sm',
          selected && 'shadow-md ring-2 ring-info-text/40',
        )}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center px-2">
        <GitBranch className="h-4 w-4 text-info-text" />
        <div className="text-[10px] font-bold uppercase tracking-wide text-info-text leading-none">
          Condition
        </div>
        <div className="text-xs text-foreground truncate max-w-[150px]">{d.label}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!bg-success-text !border-0 !w-2.5 !h-2.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        className="!bg-destructive !border-0 !w-2.5 !h-2.5"
      />
    </div>
  );
});

export default ConditionNode;
