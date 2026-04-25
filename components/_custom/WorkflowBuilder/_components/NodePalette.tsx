'use client';

import {
  Bell,
  Edit3,
  GitBranch,
  PlusCircle,
  ShieldCheck,
  Square,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { Text } from '@/components/ui/atoms';
import { cn } from '@/lib/utils';

interface PaletteItem {
  type: string;
  stepType: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'condition', stepType: 'condition', label: 'Condition', icon: GitBranch, description: 'If/else gate' },
  { type: 'action', stepType: 'create_record', label: 'Create record', icon: PlusCircle, description: 'Insert a row' },
  { type: 'action', stepType: 'update_field', label: 'Update field', icon: Edit3, description: 'Modify a value' },
  { type: 'action', stepType: 'send_notification', label: 'Notification', icon: Bell, description: 'Send an alert' },
  { type: 'action', stepType: 'call_webhook', label: 'Webhook', icon: Webhook, description: 'Call external URL' },
  { type: 'approval', stepType: 'approval_gate', label: 'Approval gate', icon: ShieldCheck, description: 'Pause for approval' },
  { type: 'end', stepType: 'end', label: 'End', icon: Square, description: 'Terminal node' },
];

export interface NodePaletteProps {
  onAddNode: (type: string, stepType: string) => void;
  disabled?: boolean;
}

export function NodePalette({ onAddNode, disabled }: Readonly<NodePaletteProps>) {
  const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData(
      'application/workflow-node',
      JSON.stringify({ type: item.type, stepType: item.stepType }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-52 shrink-0 overflow-y-auto border-r border-border bg-muted/30 p-2">
      <Text size="xs" weight="bold" color="muted" className="block mb-2 px-1 uppercase tracking-wider">
        Node palette
      </Text>
      <div className="space-y-1.5">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.stepType}
              type="button"
              draggable={!disabled}
              onDragStart={(e) => !disabled && onDragStart(e, item)}
              onClick={() => !disabled && onAddNode(item.type, item.stepType)}
              disabled={disabled}
              className={cn(
                'group flex w-full items-start gap-2 rounded border border-border bg-card px-2 py-1.5 text-left',
                'transition-all duration-150',
                !disabled && 'hover:border-primary hover:shadow-sm hover:translate-x-0.5 cursor-grab active:cursor-grabbing',
                disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground leading-tight">
                  {item.label}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default NodePalette;
