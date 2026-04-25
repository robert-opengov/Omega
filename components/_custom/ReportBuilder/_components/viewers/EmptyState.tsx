'use client';

import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/molecules';
import { Text } from '@/components/ui/atoms';

export interface ViewerEmptyStateProps {
  title: string;
  description?: ReactNode;
}

export function ViewerEmptyState({
  title,
  description,
}: Readonly<ViewerEmptyStateProps>) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <Text weight="medium" size="sm">
              {title}
            </Text>
            {description ? (
              <Text size="xs" color="muted" className="mt-1">
                {description}
              </Text>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
