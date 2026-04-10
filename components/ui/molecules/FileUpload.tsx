'use client';

import { useState, useRef, useCallback, type DragEvent } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  /** Accepted MIME types or extensions. */
  accept?: string;
  /** Maximum file size in bytes. */
  maxSize?: number;
  maxFiles?: number;
  /** @default false */
  multiple?: boolean;
  onFilesChange: (files: File[]) => void;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A drag-and-drop file upload zone with file list preview.
 *
 * @example
 * <FileUpload accept="image/*" maxSize={5_000_000} onFilesChange={setFiles} />
 */
export function FileUpload({ accept, maxSize, maxFiles, multiple = false, onFilesChange, className }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((newFiles: FileList | File[]) => {
    setError('');
    const arr = Array.from(newFiles);
    const valid = arr.filter((f) => {
      if (maxSize && f.size > maxSize) {
        setError(`File "${f.name}" exceeds ${formatSize(maxSize)} limit`);
        return false;
      }
      return true;
    });
    let updated = multiple ? [...files, ...valid] : valid.slice(0, 1);
    if (maxFiles && updated.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      updated = updated.slice(0, maxFiles);
    }
    setFiles(updated);
    onFilesChange(updated);
  }, [files, maxSize, maxFiles, multiple, onFilesChange]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground">
          {accept ? `Accepted: ${accept}` : 'Any file type'}
          {maxSize ? ` (max ${formatSize(maxSize)})` : ''}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        className="hidden"
        tabIndex={-1}
      />
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Uploaded files">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded border border-border bg-card p-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="p-1 rounded hover:bg-action-hover-primary text-muted-foreground transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileUpload;
