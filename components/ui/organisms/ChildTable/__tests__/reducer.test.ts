import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChildTableState } from '../hooks/useChildTableState';
import type { ChildTableConfig, ChildTableColumn } from '../core/models';

type Row = { id: string; name: string; amount: number };

const columns: ChildTableColumn<Row>[] = [
  { key: 'name', label: 'Name', type: 'text', sortable: true },
  { key: 'amount', label: 'Amount', type: 'number', sortable: true },
];

const config: ChildTableConfig<Row> = {
  columns,
  idField: 'id',
};

const sampleData: Row[] = [
  { id: '1', name: 'Alice', amount: 100 },
  { id: '2', name: 'Bob', amount: 200 },
  { id: '3', name: 'Charlie', amount: 50 },
];

function setup(data: Row[] = sampleData) {
  return renderHook(() => useChildTableState<Row>(config, data));
}

describe('useChildTableState reducer', () => {
  it('initializes rows from data', () => {
    const { result } = setup();
    expect(result.current.state.rows).toHaveLength(3);
    expect(result.current.state.rows[0].id).toBe('1');
    expect(result.current.state.rows[0].data.name).toBe('Alice');
  });

  it('initializes with empty data', () => {
    const { result } = setup([]);
    expect(result.current.state.rows).toHaveLength(0);
  });

  describe('ADD_ROW', () => {
    it('adds a row at the end', () => {
      const { result } = setup();
      act(() => { result.current.addRow(); });
      expect(result.current.state.rows).toHaveLength(4);
      expect(result.current.state.rows[3].dirty).toBe(true);
    });

    it('adds a row at a specific index', () => {
      const { result } = setup();
      act(() => { result.current.addRow(1); });
      expect(result.current.state.rows).toHaveLength(4);
      expect(result.current.state.rows[1].dirty).toBe(true);
      expect(result.current.state.rows[2].data.name).toBe('Bob');
    });
  });

  describe('DELETE_ROWS', () => {
    it('removes rows by id', () => {
      const { result } = setup();
      act(() => { result.current.deleteRows(['2']); });
      expect(result.current.state.rows).toHaveLength(2);
      expect(result.current.state.rows.find((r) => r.id === '2')).toBeUndefined();
    });

    it('clears selection for deleted rows', () => {
      const { result } = setup();
      act(() => { result.current.toggleRowSelection('2'); });
      expect(result.current.state.selectedIds.has('2')).toBe(true);
      act(() => { result.current.deleteRows(['2']); });
      expect(result.current.state.selectedIds.has('2')).toBe(false);
    });
  });

  describe('UPDATE_CELL', () => {
    it('updates a cell value and marks row dirty', () => {
      const { result } = setup();
      act(() => { result.current.updateCell('1', 'name', 'Alicia'); });
      const row = result.current.state.rows.find((r) => r.id === '1')!;
      expect(row.data.name).toBe('Alicia');
      expect(row.dirty).toBe(true);
    });

    it('preserves original data on first edit', () => {
      const { result } = setup();
      act(() => { result.current.updateCell('1', 'name', 'Alicia'); });
      const row = result.current.state.rows.find((r) => r.id === '1')!;
      expect(row.originalData?.name).toBe('Alice');
    });
  });

  describe('TOGGLE_SORT', () => {
    it('cycles through asc → desc → null', () => {
      const { result } = setup();

      act(() => { result.current.toggleSort('name'); });
      expect(result.current.state.sort).toEqual({ column: 'name', direction: 'asc' });

      act(() => { result.current.toggleSort('name'); });
      expect(result.current.state.sort).toEqual({ column: 'name', direction: 'desc' });

      act(() => { result.current.toggleSort('name'); });
      expect(result.current.state.sort).toBeNull();
    });

    it('resets to asc when switching columns', () => {
      const { result } = setup();
      act(() => { result.current.toggleSort('name'); });
      act(() => { result.current.toggleSort('amount'); });
      expect(result.current.state.sort).toEqual({ column: 'amount', direction: 'asc' });
    });
  });

  describe('displayRows (search → filter → sort)', () => {
    it('filters by search term', () => {
      const { result } = setup();
      act(() => { result.current.setSearchTerm('bob'); });
      expect(result.current.displayRows).toHaveLength(1);
      expect(result.current.displayRows[0].data.name).toBe('Bob');
    });

    it('sorts displayRows by column', () => {
      const { result } = setup();
      act(() => { result.current.toggleSort('amount'); });
      expect(result.current.displayRows[0].data.name).toBe('Charlie');
      expect(result.current.displayRows[2].data.name).toBe('Bob');
    });

    it('filters by column filter', () => {
      const { result } = setup();
      act(() => {
        result.current.dispatch({
          type: 'ADD_FILTER',
          filter: { column: 'amount', operator: 'greaterThan', value: 75 },
        });
      });
      expect(result.current.displayRows).toHaveLength(2);
    });
  });

  describe('SET_ROWS pagination preservation', () => {
    it('clamps currentPage when new rows fit fewer pages', () => {
      const { result } = setup();
      act(() => { result.current.setPageSize(2); });
      act(() => { result.current.setCurrentPage(1); });
      expect(result.current.state.currentPage).toBe(1);

      act(() => {
        result.current.setRows([
          { id: '1', data: { id: '1', name: 'Solo', amount: 0 } },
        ]);
      });
      expect(result.current.state.currentPage).toBe(0);
    });
  });

  describe('MOVE_ROW', () => {
    it('moves a row from one position to another', () => {
      const { result } = setup();
      act(() => { result.current.moveRow(0, 2); });
      expect(result.current.state.rows[0].data.name).toBe('Bob');
      expect(result.current.state.rows[2].data.name).toBe('Alice');
    });
  });

  describe('selection', () => {
    it('toggles row selection', () => {
      const { result } = setup();
      act(() => { result.current.toggleRowSelection('1'); });
      expect(result.current.state.selectedIds.has('1')).toBe(true);
      act(() => { result.current.toggleRowSelection('1'); });
      expect(result.current.state.selectedIds.has('1')).toBe(false);
    });

    it('selects all and clears', () => {
      const { result } = setup();
      act(() => { result.current.selectAll(); });
      expect(result.current.state.selectedIds.size).toBe(3);
      act(() => { result.current.clearSelection(); });
      expect(result.current.state.selectedIds.size).toBe(0);
    });
  });

  describe('MARK_CLEAN / REVERT_ROW', () => {
    it('marks all rows clean', () => {
      const { result } = setup();
      act(() => { result.current.updateCell('1', 'name', 'X'); });
      act(() => { result.current.markAllClean(); });
      const row = result.current.state.rows.find((r) => r.id === '1')!;
      expect(row.dirty).toBe(false);
      expect(row.originalData).toBeUndefined();
    });

    it('reverts a dirty row to original data', () => {
      const { result } = setup();
      act(() => { result.current.updateCell('1', 'name', 'X'); });
      act(() => { result.current.revertRow('1'); });
      const row = result.current.state.rows.find((r) => r.id === '1')!;
      expect(row.data.name).toBe('Alice');
      expect(row.dirty).toBe(false);
    });
  });

  describe('REPLACE_IDS', () => {
    it('replaces temp row IDs with server IDs', () => {
      const { result } = setup();
      act(() => { result.current.toggleRowSelection('1'); });
      act(() => { result.current.replaceRowIds({ '1': 'server_1' }); });
      expect(result.current.state.rows[0].id).toBe('server_1');
      expect(result.current.state.selectedIds.has('server_1')).toBe(true);
      expect(result.current.state.selectedIds.has('1')).toBe(false);
    });
  });

  describe('SET_CELL_ERROR', () => {
    it('sets and clears cell errors', () => {
      const { result } = setup();
      act(() => { result.current.setCellError('1', 'name', 'Required'); });
      expect(result.current.state.rows[0].errors?.name).toBe('Required');

      act(() => { result.current.setCellError('1', 'name', null); });
      expect(result.current.state.rows[0].errors).toBeUndefined();
    });
  });

  describe('getDirtyRows', () => {
    it('returns only dirty rows', () => {
      const { result } = setup();
      expect(result.current.getDirtyRows()).toHaveLength(0);
      act(() => { result.current.updateCell('2', 'name', 'Bobby'); });
      expect(result.current.getDirtyRows()).toHaveLength(1);
      expect(result.current.getDirtyRows()[0].id).toBe('2');
    });
  });
});
