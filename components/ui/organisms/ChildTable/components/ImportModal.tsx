'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  FileUp,
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChildTableColumn } from '../core/models';
import type {
  ImportProgress,
  ParsedCSV,
  ImportValidationResult,
  ColumnMapping,
} from '../hooks/useChildTableImport';

export interface ImportableColumn {
  key: string;
  label: string;
  required?: boolean;
}

export interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (mappedRows: Record<string, unknown>[]) => void;
  columns: ImportableColumn[];
  parseFile?: (file: File) => Promise<ParsedCSV>;
  validateRows?: (
    rows: string[][],
    columns: ChildTableColumn[],
  ) => ImportValidationResult;
  mapHeaders?: (
    csvHeaders: string[],
    tableColumns: ChildTableColumn[],
  ) => ColumnMapping[];
  importProgress?: ImportProgress | null;
  onCancelImport?: () => void;
  tableColumns?: ChildTableColumn[];
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

function fallbackParseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const separator = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(separator).map((h) => h.trim().replaceAll(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map((line) =>
    line.split(separator).map((cell) => cell.trim().replaceAll(/^["']|["']$/g, '')),
  );

  return { headers, rows };
}

export function ImportModal({
  open,
  onClose,
  onComplete,
  columns,
  parseFile,
  validateRows,
  mapHeaders,
  importProgress,
  onCancelImport,
  tableColumns,
}: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setStep('upload');
      setFile(null);
      setParsed(null);
      setMapping({});
      setValidationResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'importing') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, step]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open, step]);

  const handleFileSelect = useCallback(async (f: File) => {
    setFile(f);

    let data: ParsedCSV;
    if (parseFile) {
      data = await parseFile(f);
    } else {
      const text = await f.text();
      data = fallbackParseCSV(text);
    }
    setParsed(data);

    if (mapHeaders && tableColumns) {
      const mappings = mapHeaders(data.headers, tableColumns);
      const autoMap: Record<string, string> = {};
      for (const m of mappings) {
        if (m.tableColumn) autoMap[m.tableColumn] = m.csvHeader;
      }
      setMapping(autoMap);
    } else {
      const autoMap: Record<string, string> = {};
      for (const col of columns) {
        const match = data.headers.find(
          (h) => h.toLowerCase() === col.label.toLowerCase() || h.toLowerCase() === col.key.toLowerCase(),
        );
        if (match) autoMap[col.key] = match;
      }
      setMapping(autoMap);
    }
    setStep('mapping');
  }, [columns, parseFile, mapHeaders, tableColumns]);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect],
  );

  const previewRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.slice(0, 5);
  }, [parsed]);

  const mappedPreview = useMemo(() => {
    return previewRows.map((row, rowIdx) => {
      const mapped: Record<string, string> = {};
      const rowErrors: { col: string; message: string }[] = [];

      for (const col of columns) {
        const csvHeader = mapping[col.key];
        if (!csvHeader) {
          if (col.required) rowErrors.push({ col: col.key, message: 'Required column not mapped' });
          mapped[col.key] = '';
          continue;
        }
        const headerIdx = parsed!.headers.indexOf(csvHeader);
        mapped[col.key] = headerIdx >= 0 ? (row[headerIdx] ?? '') : '';
        if (col.required && !mapped[col.key]) {
          rowErrors.push({ col: col.key, message: 'Required value missing' });
        }
      }

      return { data: mapped, errors: rowErrors, rowIdx };
    });
  }, [previewRows, mapping, columns, parsed]);

  const handleGoToPreview = useCallback(() => {
    if (validateRows && tableColumns && parsed) {
      const reorderedRows = parsed.rows.map((row) => {
        return columns.map((col) => {
          const csvHeader = mapping[col.key];
          if (!csvHeader) return '';
          const headerIdx = parsed.headers.indexOf(csvHeader);
          return headerIdx >= 0 ? (row[headerIdx] ?? '') : '';
        });
      });

      const result = validateRows(reorderedRows, tableColumns);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
    setStep('preview');
  }, [validateRows, tableColumns, parsed, columns, mapping]);

  const validationErrors = validationResult?.errors ?? [];
  const previewErrors = useMemo(() => {
    return validationErrors.filter((e) => e.row <= 5);
  }, [validationErrors]);

  const handleImport = useCallback(() => {
    if (!parsed) return;
    setStep('importing');

    const total = parsed.rows.length;
    const batchSize = Math.max(1, Math.ceil(total / 20));
    let processed = 0;
    let cancelled = false;

    const mappedRows: Record<string, unknown>[] = [];

    if (validationResult?.valid) {
      onComplete(validationResult.coercedRows);
      return;
    }

    const processBatch = () => {
      if (cancelled) return;
      const end = Math.min(processed + batchSize, total);
      for (let i = processed; i < end; i++) {
        const row = parsed.rows[i];
        const mapped: Record<string, unknown> = {};
        for (const col of columns) {
          const csvHeader = mapping[col.key];
          if (!csvHeader) continue;
          const headerIdx = parsed.headers.indexOf(csvHeader);
          mapped[col.key] = headerIdx >= 0 ? (row[headerIdx] ?? '') : '';
        }
        mappedRows.push(mapped);
      }
      processed = end;

      if (processed < total) {
        requestAnimationFrame(processBatch);
      } else {
        onComplete(mappedRows);
      }
    };

    cancelRef.current = () => { cancelled = true; };
    requestAnimationFrame(processBatch);
  }, [parsed, columns, mapping, validationResult, onComplete]);

  const cancelRef = useRef<(() => void) | null>(null);

  const handleCancel = useCallback(() => {
    cancelRef.current?.();
    onCancelImport?.();
    onClose?.();
  }, [onCancelImport, onClose]);

  const progressPercent = useMemo(() => {
    if (importProgress && importProgress.total > 0) {
      return Math.round((importProgress.current / importProgress.total) * 100);
    }
    return 0;
  }, [importProgress]);

  if (!open || !mounted) return null;

  const stepLabels: Record<Step, string> = {
    upload: 'Upload File',
    mapping: 'Map Columns',
    preview: 'Preview',
    importing: 'Importing…',
  };

  const content = (
    <div className="fixed inset-0 z-[var(--z-overlay,60)]">
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-sm animate-in fade-in-0"
        onClick={step === 'importing' ? undefined : onClose}
      />

      {/* Dialog */}
      <dialog
        ref={dialogRef}
        open
        aria-label="Import data"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-card border border-border shadow-overlay animate-in fade-in-0 zoom-in-95 p-0"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Import Data</h2>
            <div className="flex items-center gap-2 mt-1">
              {(['upload', 'mapping', 'preview', 'importing'] as Step[]).map((s, i) => (
                <span key={s} className="flex items-center gap-1 text-[11px]">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-semibold border transition-colors duration-300',
                      step === s && 'bg-primary text-primary-foreground border-primary',
                      step !== s && (['upload', 'mapping', 'preview', 'importing'].indexOf(step) > i)
                        && 'bg-primary/20 text-primary border-primary/30',
                      step !== s && (['upload', 'mapping', 'preview', 'importing'].indexOf(step) <= i)
                        && 'bg-muted text-muted-foreground border-border',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className={cn('hidden sm:inline', step === s ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                    {stepLabels[s]}
                  </span>
                  {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 hidden sm:block" />}
                </span>
              ))}
            </div>
          </div>
          {step !== 'importing' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close import dialog"
              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <button
              type="button"
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 p-10 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300 w-full',
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground hover:bg-muted/50',
              )}
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted">
                <FileUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .csv, .tsv, .xlsx
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                className="hidden"
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </button>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && parsed && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Map CSV columns to table fields. File: <span className="font-medium text-foreground">{file?.name}</span> ({parsed.rows.length} rows)
              </p>
              <div className="space-y-2">
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center gap-3 py-2 px-3 rounded border border-border bg-muted/30"
                  >
                    <span className="flex-1 text-sm text-foreground min-w-0 truncate">
                      {col.label}
                      {col.required && <span className="text-destructive ml-0.5">*</span>}
                    </span>
                    <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <select
                      value={mapping[col.key] ?? ''}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [col.key]: e.target.value }))}
                      className="flex-1 h-7 px-2 rounded border border-border bg-background text-foreground text-xs transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <option value="">— Skip —</option>
                      {parsed.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && parsed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Previewing first {previewRows.length} of {parsed.rows.length} rows
                </p>
                {validationErrors.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''} found
                  </span>
                )}
                {validationErrors.length === 0 && validationResult && (
                  <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    All rows valid
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      {columns.map((col) => (
                        <th key={col.key} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappedPreview.map(({ data, errors: rowErrors, rowIdx }) => (
                      <tr key={rowIdx} className="border-t border-border">
                        {columns.map((col) => {
                          const hasLocalError = rowErrors.some((e) => e.col === col.key);
                          const hookError = previewErrors.find(
                            (e) => e.row === rowIdx + 1 && e.column === col.label,
                          );
                          const hasError = hasLocalError || !!hookError;
                          return (
                            <td
                              key={col.key}
                              className={cn(
                                'px-3 py-2 text-foreground whitespace-nowrap',
                                hasError && 'bg-destructive/10 text-destructive',
                              )}
                              title={hookError?.message}
                            >
                              {data[col.key] || <span className="text-muted-foreground/50">—</span>}
                              {hasError && (
                                <AlertTriangle className="inline h-3 w-3 ml-1 text-destructive" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Validation error summary */}
              {validationErrors.length > 0 && (
                <div className="rounded border border-destructive/30 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-destructive mb-1.5">
                    Validation Issues ({validationErrors.length})
                  </p>
                  <ul className="space-y-0.5">
                    {validationErrors.slice(0, 20).map((err) => (
                      <li key={`${err.row}-${err.column}`} className="text-[11px] text-destructive/80">
                        Row {err.row}, {err.column}: {err.message}
                      </li>
                    ))}
                    {validationErrors.length > 20 && (
                      <li className="text-[11px] text-destructive/60 italic">
                        … and {validationErrors.length - 20} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="w-full max-w-xs">
                <div className="relative w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {importProgress?.phase === 'validating' ? 'Validating' : 'Processing'}… {progressPercent}%
                </p>
              </div>
              {onCancelImport && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded border border-border transition-all duration-300 ease-in-out',
                    'bg-background text-foreground hover:bg-muted',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'importing' && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 text-sm font-medium rounded border border-border bg-background text-foreground hover:bg-muted transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
            >
              Cancel
            </button>

            <div className="flex gap-2">
              {step === 'mapping' && (
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="h-8 px-4 text-sm font-medium rounded border border-border bg-background text-foreground hover:bg-muted transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
                >
                  Back
                </button>
              )}
              {step === 'preview' && (
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="h-8 px-4 text-sm font-medium rounded border border-border bg-background text-foreground hover:bg-muted transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
                >
                  Back
                </button>
              )}
              {step === 'mapping' && (
                <button
                  type="button"
                  onClick={handleGoToPreview}
                  className="inline-flex items-center gap-1.5 h-8 px-4 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]"
                >
                  Preview
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
              {step === 'preview' && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={validationErrors.length > 0}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-4 text-sm font-medium rounded transition-all duration-300 ease-in-out',
                    validationErrors.length > 0
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]',
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import {parsed?.rows.length ?? 0} rows
                </button>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );

  return createPortal(content, document.body);
}

export default ImportModal;
