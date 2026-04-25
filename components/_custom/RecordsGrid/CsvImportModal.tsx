'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Text, Badge } from '@/components/ui/atoms';
import { Modal } from '@/components/ui/molecules';
import { isEditable } from './columns';
import { parseCsv } from './csv';
import type { GabField } from '@/lib/core/ports/field.repository';
import type { GabRow } from '@/lib/core/ports/data.repository';

export interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: GabField[];
  /** Submit a batch of rows. Should resolve when the import is complete. */
  onImport: (rows: GabRow[]) => Promise<{ inserted: number; failed?: number }>;
}

interface ParsedFile {
  filename: string;
  headers: string[];
  rows: string[][];
  /** Map from header index → matching field, or null if unmatched. */
  mapping: (GabField | null)[];
}

export function CsvImportModal({ open, onOpenChange, fields, onImport }: CsvImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ inserted: number; failed?: number } | null>(null);

  const editableFields = fields.filter(isEditable);

  const reset = () => {
    setParsed(null);
    setError(null);
    setResult(null);
    setPending(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0) {
        setError('CSV is empty.');
        return;
      }
      const mapping = headers.map((header) => {
        const lc = header.trim().toLowerCase();
        return (
          editableFields.find(
            (f) => f.key.toLowerCase() === lc || f.name.toLowerCase() === lc,
          ) ?? null
        );
      });
      setParsed({ filename: file.name, headers, rows, mapping });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    }
  };

  const submit = async () => {
    if (!parsed) return;
    setError(null);
    setResult(null);
    setPending(true);
    try {
      const records: GabRow[] = parsed.rows.map((row) => {
        const obj: GabRow = {};
        parsed.mapping.forEach((field, i) => {
          if (!field) return;
          const cell = row[i] ?? '';
          if (cell === '') return;
          try {
            obj[field.key] = parseValue(field, cell);
          } catch {
            obj[field.key] = cell;
          }
        });
        return obj;
      });
      const r = await onImport(records);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setPending(false);
    }
  };

  const matched = parsed ? parsed.mapping.filter(Boolean).length : 0;
  const unmatched = parsed ? parsed.mapping.length - matched : 0;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      title="Import CSV"
      description="Headers must match field names or keys. Unmatched columns are skipped."
      size="lg"
    >
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {!parsed && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-muted/40 transition-colors flex flex-col items-center gap-2"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <Text size="sm" weight="medium">Click to upload a CSV file</Text>
            <Text size="xs" color="muted">
              First row is treated as headers. Computed and system columns are ignored.
            </Text>
          </button>
        )}

        {parsed && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded border border-border bg-muted/30">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <Text size="sm" weight="medium" className="truncate">{parsed.filename}</Text>
                <Text size="xs" color="muted">
                  {parsed.rows.length} rows · {matched} matched · {unmatched} unmatched
                </Text>
              </div>
              <Button variant="outline" size="sm" onClick={reset} disabled={pending}>
                Choose another
              </Button>
            </div>

            <div>
              <Text size="xs" weight="medium" color="muted" className="mb-1.5">
                Header mapping
              </Text>
              <div className="rounded border border-border max-h-40 overflow-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {parsed.headers.map((header, i) => {
                      const field = parsed.mapping[i];
                      return (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-3 py-1.5 font-mono">{header}</td>
                          <td className="px-3 py-1.5 text-right">
                            {field ? (
                              <Badge variant="success" size="sm">
                                → {field.name}
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">
                                skipped
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {parsed.rows.length > 0 && (
              <div>
                <Text size="xs" weight="medium" color="muted" className="mb-1.5">
                  Preview (first 5 rows)
                </Text>
                <div className="rounded border border-border overflow-auto">
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
                      {parsed.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} className="border-t border-border">
                          {parsed.headers.map((_h, ci) => (
                            <td key={ci} className="px-3 py-1.5 truncate max-w-32">
                              {row[ci] ?? ''}
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
        )}

        {error && (
          <div className="flex items-start gap-2 p-2 rounded bg-danger-light text-danger-text">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <Text size="sm">{error}</Text>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-2 p-2 rounded bg-success-light text-success-text">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <Text size="sm">
              Imported {result.inserted} records
              {result.failed ? ` (${result.failed} failed)` : ''}.
            </Text>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="primary"
            onClick={submit}
            disabled={pending || !parsed || matched === 0}
          >
            {pending ? 'Importing…' : `Import ${parsed?.rows.length ?? 0} rows`}
          </Button>
        )}
      </div>
    </Modal>
  );
}

function parseValue(field: GabField, raw: string): unknown {
  switch (field.type) {
    case 'boolean':
    case 'checkbox':
      return raw === 'true' || raw === '1' || raw.toLowerCase() === 'yes';
    case 'number':
    case 'decimal':
    case 'currency': {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    case 'integer': {
      const n = Number(raw);
      return Number.isInteger(n) ? n : raw;
    }
    case 'json':
    case 'object':
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default:
      return raw;
  }
}
