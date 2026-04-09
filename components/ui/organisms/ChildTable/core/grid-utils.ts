/**
 * Pure grid utility functions -- pagination math, column layout, formatting.
 * No framework imports.
 */
import type { ChildTableColumn, ChildTableConfig } from './models/table.models';

export function calcTotalPages(totalRecords: number, pageSize: number): number {
  const size = Math.max(1, Number(pageSize) || 1);
  if (totalRecords <= 0) return 1;
  return Math.max(1, Math.ceil(totalRecords / size));
}

export function calcPaginationStart(currentPage: number, pageSize: number, totalRecords: number): number {
  if (totalRecords <= 0) return 0;
  return currentPage * pageSize + 1;
}

export function calcPaginationEnd(currentPage: number, pageSize: number, totalRecords: number): number {
  if (totalRecords <= 0) return 0;
  return Math.min((currentPage + 1) * pageSize, totalRecords);
}

export function slicePageRows<T>(rows: T[], currentPage: number, pageSize: number): T[] {
  const start = currentPage * pageSize;
  return rows.slice(start, start + pageSize);
}

export function getColumnMinWidthPx<T>(column: ChildTableColumn<T>): number {
  return typeof column.minWidth === 'number' ? column.minWidth : 80;
}

export function getColumnMaxWidthPx(): number {
  return 2000;
}

export function resolveColumnWidthPx<T>(
  column: ChildTableColumn<T>,
  widthOverrides: Map<string, number>,
): number {
  const override = widthOverrides.get(column.key);
  if (typeof override === 'number') return override;
  if (typeof column.width === 'number') return column.width;
  if (typeof column.minWidth === 'number') return column.minWidth;
  return 100;
}

export function clampColumnWidth(widthPx: number, minW: number, maxW: number): number {
  return Math.max(minW, Math.min(maxW, Math.round(widthPx)));
}

export function buildGridTemplateColumns<T>(
  visibleColumns: ChildTableColumn<T>[],
  widthOverrides: Map<string, number>,
  config: { showRowActions?: boolean },
): string {
  const parts: string[] = [];
  parts.push('56px');
  if (config.showRowActions !== false) {
    parts.push('80px');
  }
  for (const col of visibleColumns) {
    const dataW = resolveColumnWidthPx(col, widthOverrides);
    const sortW = col.sortable ? 36 : 0;
    const menuW = 38;
    const colW = dataW + sortW + menuW;
    parts.push(`minmax(${colW}px, 1fr)`);
  }
  return parts.join(' ');
}

export function calcColumnCount<T>(
  visibleColumns: ChildTableColumn<T>[],
  config: ChildTableConfig<T>,
): number {
  let count = visibleColumns.length;
  if (config.selectable || config.rowReorderable) count++;
  if (config.showRowActions !== false) count++;
  return count;
}

export function calcUtilityColumnCount<T>(config: ChildTableConfig<T>): number {
  let n = 0;
  if (config.selectable || config.rowReorderable) n++;
  if (config.showRowActions !== false) n++;
  return n;
}

export function formatCurrency(value: unknown): string {
  if (value == null || value === '') return '';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

export function formatDate(value: unknown): string {
  if (!value) return '';
  const s = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export function formatDatetime(value: unknown): string {
  if (!value) return '';
  const s = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US') + ' ' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0');
}

export const IS_MAC = typeof navigator !== 'undefined'
  && /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);

export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';
