'use client';

import type { ReactNode } from 'react';
import { CheckCircle, Circle, XCircle, MinusCircle, AlertOctagon } from 'lucide-react';
import { Spinner } from '@/components/ui/atoms/Spinner';
import { cn } from '@/lib/utils';

export type StatusStepStatus = 'completed' | 'in-progress' | 'pending' | 'error' | 'cancelled' | 'blocked';

export interface StatusStepProps {
  status: StatusStepStatus;
  label: ReactNode;
  /** Override the default icon for completed status */
  completedIcon?: ReactNode;
  /** Override the default icon for pending status */
  pendingIcon?: ReactNode;
  /** Override the default spinner for in-progress status */
  inProgressIcon?: ReactNode;
  /** Override the default icon for error status */
  errorIcon?: ReactNode;
  /** Override the default icon for cancelled status */
  cancelledIcon?: ReactNode;
  /** Override the default icon for blocked status */
  blockedIcon?: ReactNode;
  className?: string;
}

const iconMap: Record<StatusStepStatus, { icon: typeof CheckCircle; className: string }> = {
  completed: { icon: CheckCircle, className: 'text-success' },
  'in-progress': { icon: Circle, className: '' },
  pending: { icon: Circle, className: 'text-border' },
  error: { icon: XCircle, className: 'text-destructive' },
  cancelled: { icon: MinusCircle, className: 'text-muted-foreground' },
  blocked: { icon: AlertOctagon, className: 'text-warning' },
};

const overrideKeys: Record<StatusStepStatus, keyof StatusStepProps | null> = {
  completed: 'completedIcon',
  'in-progress': 'inProgressIcon',
  pending: 'pendingIcon',
  error: 'errorIcon',
  cancelled: 'cancelledIcon',
  blocked: 'blockedIcon',
};

export function StatusStep(props: StatusStepProps) {
  const { status, label, className } = props;

  const renderIcon = () => {
    if (status === 'in-progress') {
      return props.inProgressIcon ?? <Spinner size="sm" />;
    }

    const overrideKey = overrideKeys[status];
    if (overrideKey && props[overrideKey]) return props[overrideKey] as ReactNode;

    const { icon: Icon, className: iconClass } = iconMap[status];
    const size = status === 'pending' ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]';
    return <Icon className={cn(size, iconClass)} />;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center justify-center h-[22px] w-[22px] shrink-0">
        {renderIcon()}
      </div>
      <span className="text-base leading-5 tracking-[0.15px] text-foreground">
        {label}
      </span>
    </div>
  );
}

export default StatusStep;
