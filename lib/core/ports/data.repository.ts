export type GabRow = Record<string, any>;

export interface FetchRowsParams {
  tableKey: string;
  applicationKey: string;
  reportKey?: string;
  limit?: number;
  offset?: number;
  search?: string;
  filters?: Record<string, any>;
}

export interface SyncAction {
  action: 'new' | 'update' | 'delete';
  id?: number;
  fields?: Record<string, any>;
}

export interface IGabDataRepository {
  /**
   * Fetch rows from a specific table/report.
   */
  fetchRows(params: FetchRowsParams): Promise<{ data: GabRow[]; total: number }>;

  /**
   * Create a single row in a table.
   */
  createRow(tableKey: string, applicationKey: string, data: GabRow): Promise<any>;

  /**
   * Update a single row in a table.
   */
  updateRow(tableKey: string, applicationKey: string, rowId: number, data: GabRow): Promise<any>;

  /**
   * Delete one or more rows from a table.
   */
  deleteRows(tableKey: string, applicationKey: string, rowIds: number[]): Promise<any>;

  /**
   * Perform bulk operations (insert, update, delete) in a single transaction.
   */
  syncRows(tableKey: string, applicationKey: string, actions: SyncAction[]): Promise<any>;
}
