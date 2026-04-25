import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from '../../serializer';

export const TriggerNode = memo(function TriggerNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={cn(
        'rounded-full border-2 px-4 py-2 flex items-center gap-2 min-w-[180px] shadow-sm bg-success-light border-success-text',
        selected && 'shadow-md ring-2 ring-success-text/40',
      )}
    >
      <Play className="h-4 w-4 text-success-text shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-success-text leading-none">
          Trigger
        </div>
        <div className="text-xs font-medium text-foreground truncate">{d.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-success-text !border-0 !w-2.5 !h-2.5" />
    </div>
  );
});

export default TriggerNode;
