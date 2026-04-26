'use client';

/**
 * ImportStepper — multi-step CSV import wizard wired behind the
 * `app.csvImportStepper` flag. Replaces the simple `CsvImportModal`
 * with an explicit upload → header-map → validate → import flow,
 * including a per-row error report so users see exactly what fails
 * before committing the import.
 *
 * Falls back to `CsvImportModal` when the flag is OFF — the wrapper
 * lives in `RecordsGrid.tsx` so this file never has to know about
 * the toggle.
 */

import { useMemo, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button, Text, Badge, Select } from '@/components/ui/atoms';
import { Modal, ProgressSteps, type Step } from '@/components/ui/molecules';
import { isEditable } from './columns';
import { parseCsv } from './csv';
import { validateCsv, type CsvValidationResult } from '@/lib/csv/validate';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';

export interface ImportStepperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: GabField[];
  onImport: (rows: GabRow[]) => Promise<{ inserted: number; failed?: number }>;
}

type StepId = 'upload' | 'map' | 'validate' | 'import' | 'done';

const STEPS: Step[] = [
  { label: 'Upload', description: 'Choose a CSV file' },
  { label: 'Map', description: 'Match headers to fields' },
  { label: 'Validate', description: 'Preview before import' },
  { label: 'Import', description: 'Write the rows' },
  { label: 'Done' },
];

interface ParsedFile {
  filename: string;
  headers: string[];
  rows: string[][];
}

export function ImportStepper({ open, onOpenChange, fields, onImport }: ImportStepperProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const editableFields = useMemo(() => fields.filter(isEditable), [fields]);

  const [step, setStep] = useState<StepId>('upload');
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ inserted: number; failed?: number } | null>(null);

  const reset = () => {
    setStep('upload');
    setParsed(null);
    setMapping({});
    setError(null);
    setPending(false);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const stepIndex = STEPS.findIndex(
    (s) => s.label.toLowerCase() === (step === 'done' ? 'done' : step),
  );

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0) {
        setError('CSV is empty.');
        return;
      }
      const initialMap: Record<string, string | null> = {};
      headers.forEach((header) => {
        const lc = header.trim().toLowerCase();
        const match = editableFields.find(
          (f) => f.key.toLowerCase() === lc || f.name.toLowerCase() === lc,
        );
        initialMap[header.trim()] = match?.key ?? null;
      });
      setParsed({ filename: file.name, headers, rows });
      setMapping(initialMap);
      setStep('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    }
  };

  const validation: CsvValidationResult | null = useMemo(() => {
    if (!parsed) return null;
    return validateCsv({
      headers: parsed.headers,
      rows: parsed.rows,
      fields: editableFields,
      mapping,
    });
  }, [parsed, editableFields, mapping]);

  const validRows = useMemo(() => {
    if (!validation) return [];
    return validation.rows.filter((r) => r.errors.length === 0).map((r) => r.values as GabRow);
  }, [validation]);

  const submit = async () => {
    if (validRows.length === 0) {
      setError('Nothing to import — fix the errors above first.');
      return;
    }
    setError(null);
    setPending(true);
    setStep('import');
    try {
      const r = await onImport(validRows);
      setResult(r);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('validate');
    } finally {
      setPending(false);
    }
  };

  const matchedCount = parsed
    ? Object.values(mapping).filter((v) => typeof v === 'string').length
    : 0;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      title="Import CSV"
      description="Upload a file, map its columns to fields, and preview validation before committing."
      size="2xl"
    >
      <div className="space-y-4">
        <ProgressSteps steps={STEPS} currentStep={Math.max(0, stepIndex)} />

        {error && (
          <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <Text size="sm">{error}</Text>
          </div>
        )}

        {step === 'upload' && (
          <UploadStep inputRef={inputRef} onFile={handleFile} />
        )}

        {step === 'map' && parsed && (
          <MapStep
            parsed={parsed}
            fields={editableFields}
            mapping={mapping}
            matchedCount={matchedCount}
            setMapping={setMapping}
          />
        )}

        {step === 'validate' && parsed && validation && (
          <ValidateStep parsed={parsed} validation={validation} />
        )}

        {step === 'import' && (
          <div className="rounded border border-border p-6 text-center">
            <Text size="sm">Importing {validRows.length} rows…</Text>
          </div>
        )}

        {step === 'done' && result && (
          <div className="flex items-start gap-2 p-3 rounded bg-success-light text-success-text">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <Text size="sm" weight="medium">
                Imported {result.inserted} record{result.inserted === 1 ? '' : 's'}
                {result.failed ? `, ${result.failed} failed` : ''}.
              </Text>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          {step === 'done' ? 'Close' : 'Cancel'}
        </Button>

        <div className="flex gap-2">
          {step === 'map' && (
            <Button type="button" variant="outline" icon={ChevronLeft} onClick={reset}>
              Back
            </Button>
          )}
          {step === 'map' && (
            <Button
              type="button"
              iconRight={ChevronRight}
              onClick={() => setStep('validate')}
              disabled={matchedCount === 0}
            >
              Continue
            </Button>
          )}
          {step === 'validate' && (
            <>
              <Button
                type="button"
                variant="outline"
                icon={ChevronLeft}
                onClick={() => setStep('map')}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={pending || validRows.length === 0}
                loading={pending}
              >
                Import {validRows.length} row{validRows.length === 1 ? '' : 's'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function UploadStep({
  inputRef,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
}) {
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-muted/40 transition-colors flex flex-col items-center gap-2"
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <Text size="sm" weight="medium">
          Click to upload a CSV file
        </Text>
        <Text size="xs" color="muted">
          First row is treated as headers. Computed and system columns are ignored.
        </Text>
      </button>
    </>
  );
}

function MapStep({
  parsed,
  fields,
  mapping,
  matchedCount,
  setMapping,
}: {
  parsed: ParsedFile;
  fields: GabField[];
  mapping: Record<string, string | null>;
  matchedCount: number;
  setMapping: (next: Record<string, string | null>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded border border-border bg-muted/30">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <Text size="sm" weight="medium" className="truncate">
            {parsed.filename}
          </Text>
          <Text size="xs" color="muted">
            {parsed.rows.length} rows · {matchedCount} of {parsed.headers.length} columns mapped
          </Text>
        </div>
      </div>

      <div className="rounded border border-border max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">CSV header</th>
              <th className="px-3 py-2 text-left font-medium">Maps to field</th>
            </tr>
          </thead>
          <tbody>
            {parsed.headers.map((header, i) => {
              const trimmed = header.trim();
              const value = mapping[trimmed] ?? '';
              return (
                <tr key={`${header}-${i}`} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono text-xs">{header}</td>
                  <td className="px-3 py-1.5">
                    <Select
                      value={value}
                      onChange={(e) =>
                        setMapping({
                          ...mapping,
                          [trimmed]: e.target.value === '' ? null : e.target.value,
                        })
                      }
                      className="h-8 text-xs"
                    >
                      <option value="">— skip —</option>
                      {fields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.name} ({f.type})
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValidateStep({
  parsed,
  validation,
}: {
  parsed: ParsedFile;
  validation: CsvValidationResult;
}) {
  const errorRows = validation.rows.filter((r) => r.errors.length > 0);
  const cleanRows = validation.totalRows - validation.totalRowsWithErrors;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Rows" value={String(validation.totalRows)} />
        <Stat label="Ready" value={String(cleanRows)} variant="success" />
        <Stat label="With errors" value={String(validation.totalRowsWithErrors)} variant="danger" />
      </div>

      {validation.unmatchedHeaders.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Skipped headers: {validation.unmatchedHeaders.join(', ')}
        </div>
      )}

      {errorRows.length > 0 && (
        <div>
          <Text size="xs" weight="medium" color="muted" className="mb-1.5">
            First 50 rows with errors
          </Text>
          <div className="rounded border border-border max-h-64 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium w-16">Row</th>
                  <th className="px-3 py-1.5 text-left font-medium">Issue</th>
                </tr>
              </thead>
              <tbody>
                {errorRows.slice(0, 50).map((row) =>
                  row.errors.map((e, ei) => (
                    <tr
                      key={`${row.rowIndex}-${ei}`}
                      className="border-t border-border align-top"
                    >
                      <td className="px-3 py-1.5 font-mono">{row.rowIndex}</td>
                      <td className="px-3 py-1.5">
                        <Badge variant="danger" size="sm">
                          {e.fieldName}
                        </Badge>{' '}
                        {e.message}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parsed.rows.length > 0 && (
        <div>
          <Text size="xs" weight="medium" color="muted" className="mb-1.5">
            Preview (first 5 rows that will be imported)
          </Text>
          <div className="rounded border border-border overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  {parsed.headers.map((h, i) => (
                    <th key={i} className="px-3 py-1.5 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validation.rows
                  .filter((r) => r.errors.length === 0)
                  .slice(0, 5)
                  .map((r, ri) => (
                    <tr key={ri} className="border-t border-border">
                      {parsed.headers.map((_h, ci) => (
                        <td key={ci} className="px-3 py-1.5 truncate max-w-32">
                          {String(parsed.rows[r.rowIndex - 2]?.[ci] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'danger';
}) {
  const tone =
    variant === 'success'
      ? 'text-success-text bg-success-light'
      : variant === 'danger'
        ? 'text-danger-text bg-danger-light'
        : 'text-foreground bg-muted/40';
  return (
    <div className={`rounded border border-border p-2 ${tone}`}>
      <Text size="xs" weight="medium">
        {label}
      </Text>
      <Text size="lg" weight="bold">
        {value}
      </Text>
    </div>
  );
}
