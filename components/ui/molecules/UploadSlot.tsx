'use client';

import type { ReactNode } from 'react';
import { FileText, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/atoms/Button';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { cn } from '@/lib/utils';

export interface UploadSlotFile {
  /** Display name of the uploaded document. */
  title: string;
  /** Filename shown below the title (e.g. "sf-report-425.docx"). */
  filename: string;
  /** Optional due-date string (e.g. "Due: Apr 29, 2026"). */
  dueDate?: string;
}

export interface UploadSlotProps {
  /** Row label (e.g. "Quarter 1"). */
  label: string;
  /** When present, renders the filled state with file details. */
  file?: UploadSlotFile;
  /** Called when the user clicks the Upload button (empty state). */
  onUpload?: () => void;
  /** Called when the user clicks the delete icon (filled state). */
  onDelete?: () => void;
  /** Label for the upload button. @default 'Upload' */
  uploadLabel?: ReactNode;
  className?: string;
}

/**
 * A quarterly upload slot for document wizards.
 *
 * Renders in two visual states:
 * - **Empty**: label + dotted separator + secondary "Upload" button
 * - **Filled**: label + bordered card with file title, due date, filename, and delete icon
 *
 * Reuses the existing `Button` and `IconButton` atoms.
 *
 * @example
 * <UploadSlot label="Quarter 1" onUpload={() => openPicker()} />
 *
 * @example
 * <UploadSlot
 *   label="Quarter 1"
 *   file={{ title: 'Federal Financial Report (SF-425)', filename: 'sf-report.docx', dueDate: 'Due: Apr 29, 2026' }}
 *   onDelete={() => removeFile(0)}
 * />
 */
export function UploadSlot({ label, file, onUpload, onDelete, uploadLabel = 'Upload', className }: UploadSlotProps) {
  if (file) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <span className="text-sm font-semibold leading-normal tracking-[0.17px] text-foreground">
          {label}
        </span>
        <div className="border border-border rounded p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold leading-5 tracking-[0.17px] text-foreground">
              {file.title}
            </span>
            {onDelete && (
              <IconButton
                icon={Trash2}
                label={`Remove ${label}`}
                size="sm"
                variant="ghost"
                onClick={onDelete}
              />
            )}
          </div>
          {file.dueDate && (
            <span className="text-xs leading-4 tracking-[0.17px] text-foreground">
              {file.dueDate}
            </span>
          )}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-secondary shrink-0" />
            <span className="text-xs leading-4 tracking-[0.17px] text-text-secondary">
              {file.filename}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-end gap-1', className)}>
      <div className="flex flex-1 items-end gap-1">
        <span className="text-sm font-semibold leading-normal tracking-[0.17px] text-foreground shrink-0">
          {label}
        </span>
        <div className="flex-1 border-b border-dotted border-border mb-0.5" />
      </div>
      <Button
        variant="outline"
        size="sm"
        icon={Upload}
        onClick={onUpload}
      >
        {uploadLabel}
      </Button>
    </div>
  );
}

export default UploadSlot;
