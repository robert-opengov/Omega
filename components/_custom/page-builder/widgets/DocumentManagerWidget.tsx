'use client';

import { FolderOpen } from 'lucide-react';
import { WidgetStub } from './_shared/WidgetStub';
import type { LazyWidgetProps } from '@/lib/page-builder/lazy-app-components';

export function DocumentManagerWidget(_p: LazyWidgetProps) {
  return (
    <WidgetStub
      icon={FolderOpen}
      label="Document Manager"
      description="Folder-aware document list with upload, preview, and download actions."
      expectedFields={['name', 'type', 'size', 'updatedAt']}
      notes="Implementation pending — uses gabDocumentsRepo for CRUD."
    />
  );
}
