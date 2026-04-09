'use client';

import { useCallback, useEffect, useRef } from 'react';

import type { ChildTableColumn, ChildTableRow } from '../core/models';
import { MOD_KEY } from '../core/grid-utils';

/**
 * Return type for the accessibility hook — provides announcement helpers,
 * dual live regions, skip-link support, and keyboard shortcut utilities
 * for WCAG AA compliance. Mirrors the Angular ChildTableA11yService.
 */
export interface UseChildTableA11yReturn {
  /** Ref for the polite ARIA live region (status messages). */
  liveRegionRef: React.RefObject<HTMLDivElement | null>;
  /** Ref for the assertive ARIA live region (critical announcements). */
  assertiveRegionRef: React.RefObject<HTMLDivElement | null>;
  /** Ref for the `aria-describedby` element that lists keyboard instructions. */
  instructionsRef: React.RefObject<HTMLDivElement | null>;

  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceSort: (columnLabel: string, direction: 'asc' | 'desc') => void;
  announceRowAdded: (position: number) => void;
  announceRowsDeleted: (count: number) => void;
  announceRowMoved: (from: number, to: number) => void;
  announceSelection: (count: number) => void;
  announceFilterResults: (count: number) => void;
  announceEditSaved: () => void;
  announceFocusedCell: <T extends Record<string, unknown>>(
    position: { rowIndex: number; columnIndex: number },
    visibleColumns: ChildTableColumn<T>[],
    visibleRows: ChildTableRow<T>[],
  ) => void;
  announcePasteError: (summary: string) => void;
  announcePasteUndone: () => void;
  announceSaveBlocked: (reason: string) => void;

  getKeyboardShortcutsHelp: () => string[];
  isUndoShortcut: (event: KeyboardEvent | React.KeyboardEvent) => boolean;
  /** ID for the instructions element (use with aria-describedby on the grid). */
  instructionsId: string;
}

const INSTRUCTIONS_ID = 'ct-keyboard-instructions';

function setupLiveRegion(
  el: HTMLElement,
  liveValue: 'polite' | 'assertive',
): void {
  el.setAttribute('role', liveValue === 'assertive' ? 'alert' : 'status');
  el.setAttribute('aria-live', liveValue);
  el.setAttribute('aria-atomic', 'true');
  Object.assign(el.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  } satisfies Partial<CSSStyleDeclaration>);
}

/**
 * Accessibility hook for the ChildTable component.
 *
 * Creates dual ARIA live regions (polite + assertive) and a visually-hidden
 * instructions element for `aria-describedby`, matching the Angular
 * ChildTableA11yService's announcement strategy.
 */
export function useChildTableA11y(): UseChildTableA11yReturn {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);
  const instructionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (liveRegionRef.current) setupLiveRegion(liveRegionRef.current, 'polite');
    if (assertiveRegionRef.current) setupLiveRegion(assertiveRegionRef.current, 'assertive');

    if (instructionsRef.current) {
      instructionsRef.current.id = INSTRUCTIONS_ID;
      Object.assign(instructionsRef.current.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      } satisfies Partial<CSSStyleDeclaration>);
      instructionsRef.current.textContent =
        `Use arrow keys to navigate cells. Press Enter or F2 to edit. ${MOD_KEY}+C to copy, ${MOD_KEY}+V to paste. Press Escape to cancel.`;
    }
  }, []);

  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const el =
        priority === 'assertive'
          ? assertiveRegionRef.current
          : liveRegionRef.current;
      if (!el) return;

      el.textContent = '';
      requestAnimationFrame(() => {
        el.textContent = message;
      });
    },
    [],
  );

  const announceSort = useCallback(
    (columnLabel: string, direction: 'asc' | 'desc') => {
      const dir = direction === 'asc' ? 'ascending' : 'descending';
      announce(`Sorted by ${columnLabel}, ${dir}`);
    },
    [announce],
  );

  const announceRowAdded = useCallback(
    (position: number) => {
      announce(`Row added at position ${position}`);
    },
    [announce],
  );

  const announceRowsDeleted = useCallback(
    (count: number) => {
      announce(`${count} row${count === 1 ? '' : 's'} deleted`);
    },
    [announce],
  );

  const announceRowMoved = useCallback(
    (from: number, to: number) => {
      announce(`Row moved from position ${from + 1} to ${to + 1}`);
    },
    [announce],
  );

  const announceSelection = useCallback(
    (count: number) => {
      if (count === 0) {
        announce('Selection cleared');
      } else {
        announce(`${count} row${count === 1 ? '' : 's'} selected`);
      }
    },
    [announce],
  );

  const announceFilterResults = useCallback(
    (count: number) => {
      announce(`Filter applied, ${count} result${count === 1 ? '' : 's'} found`);
    },
    [announce],
  );

  const announceEditSaved = useCallback(() => {
    announce('Cell edit saved');
  }, [announce]);

  const announceFocusedCell = useCallback(
    <T extends Record<string, unknown>>(
      position: { rowIndex: number; columnIndex: number },
      visibleColumns: ChildTableColumn<T>[],
      visibleRows: ChildTableRow<T>[],
    ) => {
      const col = visibleColumns[position.columnIndex];
      const row = visibleRows[position.rowIndex];
      if (!col || !row) return;

      const label = col.ariaLabel ?? col.label;
      const value = row.data[col.key];
      let display: string;
      if (value == null || value === '') display = 'empty';
      else if (typeof value === 'object') display = JSON.stringify(value);
      else display = String(value);

      announce(`Row ${position.rowIndex + 1}, column ${label}: ${display}`);
    },
    [announce],
  );

  const announcePasteError = useCallback(
    (summary: string) => {
      announce(
        `Paste error: ${summary}. Press ${MOD_KEY}+Z to undo or fix the values manually.`,
        'assertive',
      );
    },
    [announce],
  );

  const announcePasteUndone = useCallback(() => {
    announce('Paste undone. Original values restored.', 'assertive');
  }, [announce]);

  const announceSaveBlocked = useCallback(
    (reason: string) => {
      announce(`Save blocked: ${reason}`, 'assertive');
    },
    [announce],
  );

  const getKeyboardShortcutsHelp = useCallback((): string[] => {
    return [
      'Arrow keys: Navigate between cells',
      'Shift+Arrow keys: Extend cell selection',
      'Enter or F2: Start editing a cell',
      'Escape: Cancel editing or clear cell selection',
      'Tab: Move to next editable cell',
      'Shift+Tab: Move to previous editable cell',
      `${MOD_KEY}+A: Select all cells`,
      `${MOD_KEY}+C: Copy selected cells`,
      `${MOD_KEY}+X: Cut selected cells`,
      `${MOD_KEY}+V: Paste`,
      `${MOD_KEY}+Z: Undo last change`,
      `${MOD_KEY}+Shift+Z: Redo`,
      `${MOD_KEY}+S: Save changes`,
      `${MOD_KEY}+Shift+↑: Move row up`,
      `${MOD_KEY}+Shift+↓: Move row down`,
      'Insert: Add new row',
      `${MOD_KEY}+Delete: Delete selected rows`,
      'Space: Toggle checkbox value (on checkbox columns)',
      'Home: Jump to first cell in row',
      'End: Jump to last cell in row',
      'PageUp: Previous page',
      'PageDown: Next page',
      'Delete/Backspace: Clear focused cell',
    ];
  }, []);

  const isUndoShortcut = useCallback(
    (event: KeyboardEvent | React.KeyboardEvent): boolean => {
      return (
        event.key === 'z' &&
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey
      );
    },
    [],
  );

  return {
    liveRegionRef,
    assertiveRegionRef,
    instructionsRef,
    announce,
    announceSort,
    announceRowAdded,
    announceRowsDeleted,
    announceRowMoved,
    announceSelection,
    announceFilterResults,
    announceEditSaved,
    announceFocusedCell,
    announcePasteError,
    announcePasteUndone,
    announceSaveBlocked,
    getKeyboardShortcutsHelp,
    isUndoShortcut,
    instructionsId: INSTRUCTIONS_ID,
  };
}
