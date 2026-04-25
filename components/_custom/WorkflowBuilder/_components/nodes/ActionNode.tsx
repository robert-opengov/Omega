import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bell, Edit3, PlusCircle, Webhook, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from '../../serializer';

const ICONS = {
  create_record: PlusCircle,
  update_field: Edit3,
  send_notification: Bell,
  call_webhook: Webhook,
} as const;

const LABELS = {
  create_record: 'Create',
  update_field: 'Update',
  send_notification: 'Notify',
  call_webhook: 'Webhook',
} as const;

export const ActionNode = memo(function ActionNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  const Icon = ICONS[d.stepType as keyof typeof ICONS] ?? Zap;
  const tag = LABELS[d.stepType as keyof typeof LABELS] ?? 'Action';
  return (
    <div
      className={cn(
        'rounded border-2 px-3 py-2 flex items-center gap-2 min-w-[180px] shadow-sm bg-card border-primary',
        selected && 'shadow-md ring-2 ring-primary/40',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !border-0 !w-2.5 !h-2.5" />
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-primary leading-none">
          {tag}
        </div>
        <div className="text-xs font-medium text-foreground truncate">{d.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !border-0 !w-2.5 !h-2.5" />
    </div>
  );
});

export default ActionNode;
