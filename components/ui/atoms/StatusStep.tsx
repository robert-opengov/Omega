'use client';

import type { ReactNode } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Spinner } from '@/components/ui/atoms/Spinner';
import { cn } from '@/lib/utils';

export type StatusStepStatus = 'completed' | 'in-progress' | 'pending';

export interface StatusStepProps {
  status: StatusStepStatus;
  label: ReactNode;
  /** Override the default icon for completed status */
  completedIcon?: ReactNode;
  /** Override the default icon for pending status */
  pendingIcon?: ReactNode;
  /** Override the default spinner for in-progress status */
  inProgressIcon?: ReactNode;
  className?: string;
}

export function StatusStep({ status, label, completedIcon, pendingIcon, inProgressIcon, className }: StatusStepProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center justify-center h-[22px] w-[22px] shrink-0">
        {status === 'completed' && (completedIcon ?? <CheckCircle className="h-[22px] w-[22px] text-success" />)}
        {status === 'in-progress' && (inProgressIcon ?? <Spinner size="sm" />)}
        {status === 'pending' && (pendingIcon ?? <Circle className="h-[18px] w-[18px] text-border" />)}
      </div>
      <span className="text-base leading-5 tracking-[0.15px] text-foreground">
        {label}
      </span>
    </div>
  );
}

export default StatusStep;
