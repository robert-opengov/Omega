import { describe, it, expect } from 'vitest';
import {
  calcTotalPages,
  calcPaginationStart,
  calcPaginationEnd,
  slicePageRows,
  buildGridTemplateColumns,
  formatCurrency,
  formatDate,
  formatDatetime,
} from '../core/grid-utils';
import type { ChildTableColumn } from '../core/models';

describe('calcTotalPages', () => {
  it('returns 1 for 0 records', () => {
    expect(calcTotalPages(0, 10)).toBe(1);
  });

  it('returns 1 when records fit on one page', () => {
    expect(calcTotalPages(5, 10)).toBe(1);
  });

  it('rounds up partial pages', () => {
    expect(calcTotalPages(11, 10)).toBe(2);
    expect(calcTotalPages(20, 10)).toBe(2);
    expect(calcTotalPages(21, 10)).toBe(3);
  });

  it('handles page size of 1', () => {
    expect(calcTotalPages(3, 1)).toBe(3);
  });
});

describe('calcPaginationStart / calcPaginationEnd', () => {
  it('returns correct range for first page', () => {
    expect(calcPaginationStart(0, 10, 25)).toBe(1);
    expect(calcPaginationEnd(0, 10, 25)).toBe(10);
  });

  it('returns correct range for middle page', () => {
    expect(calcPaginationStart(1, 10, 25)).toBe(11);
    expect(calcPaginationEnd(1, 10, 25)).toBe(20);
  });

  it('clamps end to total records on last page', () => {
    expect(calcPaginationEnd(2, 10, 25)).toBe(25);
  });

  it('returns 0 for empty data', () => {
    expect(calcPaginationStart(0, 10, 0)).toBe(0);
    expect(calcPaginationEnd(0, 10, 0)).toBe(0);
  });
});

describe('slicePageRows', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns first page', () => {
    expect(slicePageRows(items, 0, 3)).toEqual([1, 2, 3]);
  });

  it('returns middle page', () => {
    expect(slicePageRows(items, 1, 3)).toEqual([4, 5, 6]);
  });

  it('returns partial last page', () => {
    expect(slicePageRows(items, 3, 3)).toEqual([10]);
  });

  it('returns empty for out-of-range page', () => {
    expect(slicePageRows(items, 10, 3)).toEqual([]);
  });
});

describe('buildGridTemplateColumns', () => {
  const cols: ChildTableColumn[] = [
    { key: 'a', label: 'A', type: 'text', width: 120 },
    { key: 'b', label: 'B', type: 'number', width: 80 },
  ];

  it('starts with 56px row-select column', () => {
    const result = buildGridTemplateColumns(cols, new Map(), { showRowActions: false });
    expect(result.startsWith('56px')).toBe(true);
  });

  it('uses minmax() format for data columns', () => {
    const result = buildGridTemplateColumns(cols, new Map(), { showRowActions: false });
    expect(result).toMatch(/minmax\(\d+px, 1fr\)/);
  });

  it('includes actions column when showRowActions is true', () => {
    const result = buildGridTemplateColumns(cols, new Map(), { showRowActions: true });
    const parts = result.split(' ');
    expect(parts[0]).toBe('56px');
    expect(parts[1]).toBe('80px');
  });

  it('applies width overrides via minmax sizing', () => {
    const overrides = new Map([['a', 200]]);
    const resultWithOverride = buildGridTemplateColumns(cols, overrides, { showRowActions: false });
    const resultWithout = buildGridTemplateColumns(cols, new Map(), { showRowActions: false });
    expect(resultWithOverride).not.toBe(resultWithout);
  });
});

describe('formatCurrency', () => {
  it('formats number to USD', () => {
    const result = formatCurrency(1234.5);
    expect(result).toMatch(/1[,.]234/);
  });

  it('returns empty string for null', () => {
    expect(formatCurrency(null)).toBe('');
  });
});

describe('formatDate', () => {
  it('formats an ISO string', () => {
    const result = formatDate('2024-01-15');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty string for falsy', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('formatDatetime', () => {
  it('formats a datetime string', () => {
    const result = formatDatetime('2024-01-15T10:30:00');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty string for falsy', () => {
    expect(formatDatetime(null)).toBe('');
  });
});
