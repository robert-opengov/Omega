'use client';

import { Button, ButtonGroup } from '@/components/ui/atoms';
import type { ButtonGroupLayoutItem } from '@/lib/core/ports/form.repository';

export function ButtonGroupItem({
  item,
  readOnly,
}: Readonly<{ item: ButtonGroupLayoutItem; readOnly?: boolean }>) {
  const buttons = Array.isArray(item.buttons) ? item.buttons : [];
  return (
    <ButtonGroup>
      {buttons.length === 0 ? (
        <Button type="button" variant="outline" disabled={readOnly}>
          Button group
        </Button>
      ) : (
        buttons.map((button) => (
          <Button
            key={`${item.id}-${button.label}`}
            type="button"
            variant="outline"
            disabled={readOnly}
          >
            {button.label}
          </Button>
        ))
      )}
    </ButtonGroup>
  );
}
