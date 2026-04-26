'use client';

/**
 * Visual placeholder used by every vertical-widget stub in this folder.
 *
 * Each widget has its own file (so the lazy registry can dynamic-import
 * it independently) but they all share this card so future implementations
 * can be slotted in one at a time without flag churn.
 *
 * The card is intentionally informative: it tells users which fields the
 * widget will eventually consume and offers a stable visual footprint so
 * page layouts don't reflow when a widget body lands later.
 */

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/molecules';
import { Text, Badge } from '@/components/ui/atoms';

export interface WidgetStubProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  /** Field keys / identifiers the widget will read once implemented. */
  expectedFields?: string[];
  /** Implementation notes shown as a footer hint. */
  notes?: string;
}

export function WidgetStub({
  icon: Icon,
  label,
  description,
  expectedFields,
  notes,
}: WidgetStubProps) {
  return (
    <Card variant="default" className="border-dashed">
      <CardHeader action={<Badge variant="default" size="sm">stub</Badge>}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <CardTitle className="text-sm">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {description && (
          <Text size="sm" color="muted">
            {description}
          </Text>
        )}
        {expectedFields && expectedFields.length > 0 && (
          <Text size="xs" color="muted">
            Expects: {expectedFields.join(', ')}
          </Text>
        )}
        {notes && (
          <Text size="xs" color="muted" className="italic">
            {notes}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}
