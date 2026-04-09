/**
 * Child Table Data Port
 *
 * Defines the backend contract for all child-table operations.
 * Mirrors the Angular ChildTableDataService endpoint shapes exactly
 * so adapters produce compatible payloads against the GAB backend.
 */

// ---------------------------------------------------------------------------
// Payload types (match Angular's production shapes)
// ---------------------------------------------------------------------------

export interface PayloadColumn {
  data: string;
  name: string;
  searchable: boolean;
  orderable: boolean;
  search: { value: string; regex: boolean };
}

export interface RequestDatatable {
  TableKey: string;
  ReportKey: string;
  Draw: number;
  Start: number;
  Length: number;
  Order: Array<{ column: number; dir: 'asc' | 'desc' }>;
  Columns: PayloadColumn[];
  Search: { value: string; regex: boolean };
  IsGroupingEnabled: boolean;
  IsQueryReport: boolean;
  GetAll: boolean;
  FromDashboard: boolean;
  FromEmbeddedReport: boolean;
  Template: unknown[];
  ConditionGroups: unknown;
  IsEmbeddedReport?: boolean;
  LookupFieldValue?: string;
  ReferenceFieldKey?: string;
}

export interface SyncItem {
  ApplicationTableKey: string;
  ActionType: 'new' | 'update' | 'delete';
  ChildTempId?: string;
  Where?: { Rid?: number; Rids?: number[] };
  FieldsList?: Array<{
    Name: string;
    Value: string;
    Base64EncodedFile?: string | null;
    Type?: string;
  }>;
  IsBulkUpdateDelete?: boolean;
  LogTransaction?: boolean;
}

export interface SyncResponse {
  errors: number;
  new_recs: number;
  added_recs: Record<string, string>;
  updated_recs: number;
  deleted_recs: number;
  error_msg?: string[];
}

export interface DatatableResponse {
  data: Record<string, unknown>[];
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
}

export interface DropdownOption {
  Name: string | null;
  Value: string | null;
  IsActive?: boolean;
}

/** Backend report column shape from getreportcolumns / gettablefields. */
export interface ReportColumn {
  Key?: string;
  FieldKey?: string;
  FieldName: string;
  Name: string;
  FieldType: string;
  Values?: Array<{ Value: string }>;
  IsFormula?: boolean;
  IsSummaryField?: boolean;
  IsRequired?: boolean;
  IsReadOnly?: boolean;
  IsUnique?: boolean;
  IsVisible?: boolean;
  Width?: number;
  MinWidth?: number;
  Order?: number;
  DataKey?: string;
  HeaderName?: string;
}

/** Backend relation shape from getbytableid. */
export interface Relation {
  Key?: string;
  RelationType: string;
  ApplicationTableKey: string;
  ApplicationTable2Key: string;
  ReferenceFieldKey?: string;
  CustomRelation?: string;
}

// ---------------------------------------------------------------------------
// Load params (convenience wrapper over RequestDatatable)
// ---------------------------------------------------------------------------

export interface LoadRowsParams {
  tableKey: string;
  reportKey: string;
  referenceFieldKey?: string;
  lookupFieldValue?: string;
  start?: number;
  length?: number;
  draw?: number;
  searchValue?: string;
  orderColumn?: number;
  orderDir?: 'asc' | 'desc';
  columns?: PayloadColumn[];
  isEmbedded?: boolean;
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface IChildTableRepository {
  // -- Data loading --------------------------------------------------------
  loadRows(params: LoadRowsParams): Promise<DatatableResponse>;

  // -- CRUD ----------------------------------------------------------------
  syncChanges(items: SyncItem[]): Promise<SyncResponse>;
  insertRow(
    tableKey: string,
    applicationKey: string,
    fields: Array<{ Key: string; Value: string; Base64EncodedFile?: string | null; Type?: string }>,
  ): Promise<unknown>;
  updateCell(
    tableKey: string,
    applicationKey: string,
    rid: number,
    fields: Array<{ Key: string; Value: string; Base64EncodedFile?: string | null; Type?: string }>,
  ): Promise<unknown>;
  deleteRows(tableKey: string, rids: number[]): Promise<unknown>;

  // -- Relationship discovery ----------------------------------------------
  getRelations(parentTableKey: string): Promise<Relation[]>;
  findChildRelation(
    parentTableKey: string,
    childTableKey: string,
  ): Promise<Relation | null>;

  // -- Report/field metadata -----------------------------------------------
  getReports(tableKey: string): Promise<unknown[]>;
  getTableFields(tableKey: string): Promise<ReportColumn[]>;
  getReportColumns(reportKey: string, tableKey: string): Promise<ReportColumn[]>;
  getReportById(reportKey: string, tableKey: string): Promise<unknown>;

  // -- Dropdown & user options ---------------------------------------------
  fetchDropdownValues(fieldKey: string): Promise<DropdownOption[]>;
  fetchAllDropdownValues(fieldKeys: string[]): Promise<Record<string, DropdownOption[]>>;
  fetchUsers(tableKey: string, applicationId: string): Promise<DropdownOption[]>;

  // -- Form & rule metadata ------------------------------------------------
  fetchForms(tableKey: string): Promise<Array<{ Key: string; Name: string; Type?: string }>>;
  fetchFormRules(formKey: string, tableKey: string): Promise<unknown[]>;
  fetchFormSavedFields(
    formKey: string,
    tableKey: string,
    parentTableKey?: string,
  ): Promise<unknown>;

  // -- Discovery convenience -----------------------------------------------
  discoverTable(tableKey: string): Promise<{
    reports: unknown[];
    fields: ReportColumn[];
    defaultReportKey: string | null;
  }>;

  // -- Column building utilities -------------------------------------------
  buildPayloadColumns(fields: ReportColumn[]): PayloadColumn[];
}
