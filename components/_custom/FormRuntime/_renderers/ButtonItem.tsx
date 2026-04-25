'use client';

import { Button } from '@/components/ui/atoms';
import type { ButtonLayoutItem } from '@/lib/core/ports/form.repository';

interface ButtonItemProps {
  item: ButtonLayoutItem;
  readOnly?: boolean;
  onClick?: () => void;
}

export function ButtonItem({ item, readOnly, onClick }: Readonly<ButtonItemProps>) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={readOnly}
      onClick={onClick}
    >
      {item.buttonConfig?.label ?? 'Button'}
    </Button>
  );
}
