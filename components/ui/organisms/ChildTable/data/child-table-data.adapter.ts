/**
 * UI-facing facade for child-table data operations.
 *
 * Delegates all HTTP calls to the core IChildTableRepository port so
 * endpoint URLs, query params, and payload shapes are defined exactly once
 * in lib/core. This file retains only UI-specific logic:
 *  - mapping backend ReportColumn[] to ChildTableColumn[]
 *  - field-type resolution
 */
import type { IChildTableRepository, ReportColumn } from '@/lib/core/ports/child-table.repository';

import type { ChildTableColumn, ColumnType } from '../core/models';

// Re-export shared types so existing imports keep working
export type {
  PayloadColumn,
  SyncItem,
  SyncResponse,
  DropdownOption,
  ReportColumn,
  Relation,
  LoadRowsParams,
  DatatableResponse,
} from '@/lib/core/ports/child-table.repository';

// ---------------------------------------------------------------------------
// System field names that are always read-only
// ---------------------------------------------------------------------------

const SYSTEM_FIELD_NAMES = new Set([
  'createdby',
  'modifiedby',
  'datecreated',
  'datemodified',
  'id',
]);

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ChildTableDataAdapter {
  constructor(private readonly repo: IChildTableRepository) {}

  // -- Delegates -----------------------------------------------------------

  get loadRows() {
    return this.repo.loadRows.bind(this.repo);
  }
  get syncChanges() {
    return this.repo.syncChanges.bind(this.repo);
  }
  get insertRow() {
    return this.repo.insertRow.bind(this.repo);
  }
  get updateCell() {
    return this.repo.updateCell.bind(this.repo);
  }
  get deleteRows() {
    return this.repo.deleteRows.bind(this.repo);
  }
  get getRelations() {
    return this.repo.getRelations.bind(this.repo);
  }
  get findChildRelation() {
    return this.repo.findChildRelation.bind(this.repo);
  }
  get getReports() {
    return this.repo.getReports.bind(this.repo);
  }
  get getTableFields() {
    return this.repo.getTableFields.bind(this.repo);
  }
  get getReportColumns() {
    return this.repo.getReportColumns.bind(this.repo);
  }
  get getReportById() {
    return this.repo.getReportById.bind(this.repo);
  }
  get fetchDropdownValues() {
    return this.repo.fetchDropdownValues.bind(this.repo);
  }
  get fetchAllDropdownValues() {
    return this.repo.fetchAllDropdownValues.bind(this.repo);
  }
  get fetchUsers() {
    return this.repo.fetchUsers.bind(this.repo);
  }
  get fetchForms() {
    return this.repo.fetchForms.bind(this.repo);
  }
  get fetchFormRules() {
    return this.repo.fetchFormRules.bind(this.repo);
  }
  get fetchFormSavedFields() {
    return this.repo.fetchFormSavedFields.bind(this.repo);
  }
  get discoverTable() {
    return this.repo.discoverTable.bind(this.repo);
  }
  get buildPayloadColumns() {
    return this.repo.buildPayloadColumns.bind(this.repo);
  }

  // -- UI-specific column building -----------------------------------------

  buildChildTableColumns(
    fields: ReportColumn[],
    dataKeyMap: Map<string, string>,
  ): ChildTableColumn[] {
    return fields
      .filter((f) => f.IsVisible !== false)
      .sort((a, b) => (a.Order ?? 0) - (b.Order ?? 0))
      .map((field) => {
        const fieldName = field.FieldName;
        const fieldType = field.FieldType ?? '';
        const dataKey =
          dataKeyMap.get(fieldName) ??
          field.DataKey ??
          field.FieldKey ??
          fieldName;

        const isSystemField = SYSTEM_FIELD_NAMES.has(fieldName.toLowerCase());
        const isFormula = field.IsFormula === true;
        const isSummary = field.IsSummaryField === true;

        const col: ChildTableColumn = {
          key: dataKey,
          label: field.HeaderName || field.Name || fieldName,
          type: mapFieldType(fieldType),
          sortable: true,
          filterable: true,
          editable: !isFormula && !isSummary && !isSystemField,
          width: field.Width ?? 150,
          minWidth: field.MinWidth ?? 80,
          isUnique: field.IsUnique === true,
          fieldName,
        };

        if (field.IsRequired === true) {
          col.validation = [
            { type: 'required', message: `${col.label} is required` },
          ];
        }

        const ft = fieldType.toUpperCase();
        if ((ft === 'ENUM' || ft === 'ENUM2') && field.Values?.length) {
          col.type = ft === 'ENUM2' ? 'multiselect' : 'select';
          col.selectOptions = field.Values.map((v) => ({
            value: v.Value ?? '',
            label: v.Value ?? '',
          }));
        }

        return col;
      });
  }
}

// ---------------------------------------------------------------------------
// Field type mapping — matches Angular mapFieldType exactly
// ---------------------------------------------------------------------------

export function mapFieldType(fieldType: string): ColumnType {
  if (!fieldType) return 'text';
  const ft = fieldType.toUpperCase();

  if (ft.startsWith('DECIMAL')) return 'currency';
  if (ft === 'DOUBLE' || ft === 'FLOAT' || ft === 'BIGINT') return 'number';
  if (ft === 'INT' || ft.startsWith('INT(')) return 'integer';
  if (ft === 'TINYINT(1)') return 'checkbox';
  if (ft === 'ENUM') return 'select';
  if (ft === 'ENUM2') return 'multiselect';
  if (ft === 'FILE') return 'file';
  if (ft === 'DATE') return 'date';
  if (ft === 'DATETIME') return 'datetime';
  if (ft === 'TEXT') return 'textarea';
  if (ft === 'EMAIL') return 'email';
  if (ft === 'USER') return 'user';
  if (ft === 'PII' || ft === 'PII2') return 'pii';
  if (ft === 'VARCHAR(15)') return 'phone';

  return 'text';
}
