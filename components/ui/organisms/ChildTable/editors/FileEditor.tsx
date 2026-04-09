'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import type { CellEditorProps } from './index';
import { EDITOR_BASE } from './editor-styles';
import { cn } from '@/lib/utils';

interface FileValue {
  name: string;
  base64: string;
  size: number;
  type: string;
}

function parseFileValue(val: unknown): FileValue | null {
  if (val && typeof val === 'object' && 'name' in (val as Record<string, unknown>)) {
    return val as FileValue;
  }
  return null;
}

export function FileEditor({
  value,
  onSave,
  onCancel,
  autoFocus = true,
}: CellEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<FileValue | null>(() => parseFileValue(value));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autoFocus) containerRef.current?.focus();
  }, [autoFocus]);

  const readFile = useCallback(
    (file: File) => {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const result: FileValue = {
          name: file.name,
          base64: reader.result as string,
          size: file.size,
          type: file.type,
        };
        setFileInfo(result);
        setLoading(false);
        onSave(result);
      };
      reader.onerror = () => setLoading(false);
      reader.readAsDataURL(file);
    },
    [onSave],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const handleRemove = useCallback(() => {
    setFileInfo(null);
    onSave(null);
  }, [onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [onCancel],
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(EDITOR_BASE, 'flex w-full flex-col gap-2 p-2')}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="File upload editor"
    >
      {fileInfo ? (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{fileInfo.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(fileInfo.size)}</p>
          </div>
          <button
            type="button"
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-sm',
              'text-muted-foreground transition-colors duration-150 hover:bg-danger-light hover:text-danger',
              'focus-visible:outline-2 focus-visible:outline-primary',
            )}
            onClick={handleRemove}
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            'flex items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-border',
            'px-3 py-2 text-sm text-muted-foreground',
            'transition-colors duration-150 hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-2 focus-visible:outline-primary',
          )}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Upload className="h-4 w-4" />
          {loading ? 'Uploading…' : 'Choose file'}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        tabIndex={-1}
      />
    </div>
  );
}
