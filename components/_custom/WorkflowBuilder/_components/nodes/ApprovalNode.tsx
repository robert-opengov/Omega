import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from '../../serializer';

export const ApprovalNode = memo(function ApprovalNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={cn(
        'rounded border-2 px-3 py-2 flex items-center gap-2 min-w-[180px] shadow-sm bg-warning-light border-warning-text',
        selected && 'shadow-md ring-2 ring-warning-text/40',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-warning-text !border-0 !w-2.5 !h-2.5" />
      <ShieldCheck className="h-4 w-4 text-warning-text shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-warning-text leading-none">
          Approval · {d.role || 'Role'}
        </div>
        <div className="text-xs font-medium text-foreground truncate">{d.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-warning-text !border-0 !w-2.5 !h-2.5" />
    </div>
  );
});

export default ApprovalNode;
