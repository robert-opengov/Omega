/**
 * Field port — table columns including computed (formula / lookup / summary)
 * fields. Companion to {@link IGabTableRepository}; intentionally separated
 * because field operations have richer payloads than tables.
 */

// ---------------------------------------------------------------------------
// Field config sub-shapes (subset; long-tail types adapt at the adapter level)
// ---------------------------------------------------------------------------

export interface LookupConfig {
  sourceTable: string;
  sourceFieldName: string;
  referenceFieldName?: string;
}

export interface SummaryFilter {
  fieldName: string;
  operator: string;
  value: unknown;
}

export interface SummaryConfig {
  childTable: string;
  childFieldName: string;
  aggregation:
    | 'COUNT'
    | 'COUNT_UNIQUE'
    | 'COUNT_VALUES'
    | 'SUM'
    | 'MIN'
    | 'MAX'
    | 'AVG';
  referenceFieldName?: string;
  filters?: SummaryFilter[];
}

export interface ChoiceConfig {
  options: string[];
}

export interface ReferenceConfig {
  targetTable: string;
  displayField?: string | null;
}

export type FieldConfig =
  | ChoiceConfig
  | ReferenceConfig
  | Record<string, unknown>;

export interface GabField {
  id: string;
  tableId: string;
  appId?: string;
  key: string;
  name: string;
  type: string;
  required: boolean;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
  formula?: string | null;
  formulaReturnType?: string | null;
  config?: FieldConfig | null;
  lookupConfig?: LookupConfig | null;
  summaryConfig?: SummaryConfig | null;
  defaultValue?: unknown;
  /** SQL column name if the field has a typed projection. */
  typedColumn?: string | null;
}

export interface CreateFieldPayload {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  formula?: string;
  formulaReturnType?: string;
  config?: FieldConfig | null;
  lookupConfig?: LookupConfig | null;
  summaryConfig?: SummaryConfig | null;
}

export type UpdateFieldPayload = Partial<CreateFieldPayload> & {
  /** When changing `type`, the caller can specify how to handle existing data. */
  typeChangeMode?: 'metadata_only' | 'widening' | 'narrowing_with_backup' | 'narrowing_nullify';
};

// ---------------------------------------------------------------------------
// Field type-change pre-flight + dependents check (used before delete/update)
// ---------------------------------------------------------------------------

export interface FieldTypeChangeValidation {
  allowed: boolean;
  risk: 'metadata_only' | 'widening' | 'narrowing' | 'blocked';
  reason?: string;
  totalRows: number;
  nonNullRows: number;
  convertible: number;
  failures: number;
  sampleFailures: Array<{ recordId: number; value: string }>;
  currentSqlType: string | null;
  targetSqlType: string | null;
  metadataOnly: boolean;
}

export interface FieldDependent {
  fieldId: string;
  fieldKey: string;
  fieldName: string;
  tableName: string;
  tableKey: string;
  type: 'formula' | 'lookup' | 'summary' | 'summary_condition';
  detail: string;
}

export interface FieldDependents {
  blocked: boolean;
  blockReason?: string;
  dependents: FieldDependent[];
  conditionRemovals: FieldDependent[];
}

export interface IGabFieldRepository {
  listFields(
    appId: string,
    tableId: string,
    options?: { includeSystem?: boolean },
  ): Promise<{ items: GabField[]; total: number }>;
  getField(appId: string, tableId: string, fieldId: string): Promise<GabField>;
  createField(
    appId: string,
    tableId: string,
    payload: CreateFieldPayload,
  ): Promise<GabField>;
  updateField(
    appId: string,
    tableId: string,
    fieldId: string,
    payload: UpdateFieldPayload,
  ): Promise<GabField>;
  deleteField(
    appId: string,
    tableId: string,
    fieldId: string,
  ): Promise<{ ok: boolean }>;
  /** Pre-flight check for changing a field's data type. */
  validateTypeChange(
    appId: string,
    tableId: string,
    fieldId: string,
    newType: string,
  ): Promise<FieldTypeChangeValidation>;
  /** Lists every formula/lookup/summary that references the given field. */
  getFieldDependents(
    appId: string,
    tableId: string,
    fieldId: string,
  ): Promise<FieldDependents>;
}
