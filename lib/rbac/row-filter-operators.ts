/**
 * Row filter operator definitions and type-aware filtering.
 *
 * Vendored from GAB Core (`apps/web/src/features/settings/row-filter-operators.ts`)
 * to keep the visual builder in lock-step with the backend's accepted set
 * (see `packages/api-protocol/src/workspace/rbac.api.ts FilterOperatorSchema`).
 */

export interface FilterOperator {
  value: string;
  label: string;
  category: string;
}

export const FILTER_OPERATORS: FilterOperator[] = [
  { value: 'empty', label: 'Is Empty', category: 'nullability' },
  { value: 'has_value', label: 'Has Value', category: 'nullability' },
  { value: 'is_equal', label: 'Equals', category: 'equality' },
  { value: 'is_not_equal', label: 'Not Equals', category: 'equality' },
  { value: 'contains', label: 'Contains', category: 'string' },
  { value: 'not_contains', label: 'Not Contains', category: 'string' },
  { value: 'starts_with', label: 'Starts With', category: 'string' },
  { value: 'ends_with', label: 'Ends With', category: 'string' },
  { value: 'greater_than', label: 'Greater Than', category: 'comparison' },
  { value: 'less_than', label: 'Less Than', category: 'comparison' },
  { value: 'greater_than_or_equal', label: '≥', category: 'comparison' },
  { value: 'less_than_or_equal', label: '≤', category: 'comparison' },
  { value: 'true_or_false', label: 'True/False', category: 'boolean' },
  { value: 'before_date', label: 'Before Date', category: 'date' },
  { value: 'on_or_before_date', label: 'On or Before', category: 'date' },
  { value: 'after_date', label: 'After Date', category: 'date' },
  { value: 'on_or_after_date', label: 'On or After', category: 'date' },
  { value: 'between_date', label: 'Between Dates', category: 'date' },
  { value: 'days_before_today', label: 'Days Before Today', category: 'date' },
  { value: 'within_last_x_days', label: 'Within Last X Days', category: 'date' },
  { value: 'current_user', label: 'Is Current User', category: 'user' },
  { value: 'is_equal_to_user', label: 'Equals User', category: 'user' },
  { value: 'contains_current_user', label: 'Contains Current User', category: 'user' },
  { value: 'equal_to_field_value', label: 'Equals Field', category: 'cross-field' },
  { value: 'not_equal_to_field_value', label: '≠ Field', category: 'cross-field' },
  { value: 'in', label: 'In (list)', category: 'set' },
];

export const NO_VALUE_OPERATORS = new Set(['empty', 'has_value', 'current_user', 'contains_current_user']);

export const FIELD_TYPE_OPERATOR_CATEGORIES: Record<string, string[]> = {
  text:         ['nullability', 'equality', 'string', 'cross-field', 'set'],
  multiline:    ['nullability', 'equality', 'string', 'cross-field', 'set'],
  rich_text:    ['nullability', 'equality', 'string', 'cross-field', 'set'],
  email:        ['nullability', 'equality', 'string', 'cross-field', 'set'],
  phone:        ['nullability', 'equality', 'string', 'cross-field', 'set'],
  url:          ['nullability', 'equality', 'string', 'cross-field', 'set'],
  uuid:         ['nullability', 'equality', 'string', 'cross-field', 'set'],
  attachment:   ['nullability', 'equality', 'string', 'cross-field', 'set'],
  number:       ['nullability', 'equality', 'comparison', 'cross-field', 'set'],
  currency:     ['nullability', 'equality', 'comparison', 'cross-field', 'set'],
  percent:      ['nullability', 'equality', 'comparison', 'cross-field', 'set'],
  integer:      ['nullability', 'equality', 'comparison', 'cross-field', 'set'],
  reference:    ['nullability', 'equality', 'comparison', 'cross-field', 'set'],
  date:         ['nullability', 'equality', 'comparison', 'date', 'cross-field'],
  datetime:     ['nullability', 'equality', 'comparison', 'date', 'cross-field'],
  boolean:      ['nullability', 'equality', 'boolean', 'cross-field'],
  select:       ['nullability', 'equality', 'string', 'cross-field', 'set'],
  multi_select: ['nullability', 'equality', 'string', 'cross-field', 'set'],
  user:         ['nullability', 'equality', 'user', 'cross-field'],
  formula:      ['nullability', 'equality', 'string', 'cross-field', 'set'],
  lookup:       ['nullability', 'equality', 'string', 'cross-field', 'set'],
  summary:      ['nullability', 'equality', 'comparison', 'cross-field', 'set'],
};

export function getOperatorsForFieldType(fieldType: string | undefined): FilterOperator[] {
  if (!fieldType) return FILTER_OPERATORS;
  const allowed = FIELD_TYPE_OPERATOR_CATEGORIES[fieldType];
  if (!allowed) return FILTER_OPERATORS;
  return FILTER_OPERATORS.filter((op) => allowed.includes(op.category));
}

const BETWEEN_OPS = new Set(['between_date', 'not_between_date']);
const CROSS_FIELD_OPS = new Set([
  'equal_to_field_value', 'not_equal_to_field_value',
  'greater_than_field_value', 'less_than_field_value',
  'greater_than_or_equal_field_value', 'less_than_or_equal_field_value',
]);

export interface ConditionLike {
  fieldKey: string;
  operator: string;
  source: { type: string; value?: unknown; key?: string };
}

function validateStaticValue(label: string, operator: string, val: unknown): string | null {
  if (operator === 'in') {
    return (!Array.isArray(val) || val.length === 0) ? `${label}: at least one value is required` : null;
  }
  if (BETWEEN_OPS.has(operator)) {
    const range = val as { from?: unknown; to?: unknown } | null;
    return (!range?.from || !range?.to) ? `${label}: both from and to dates are required` : null;
  }
  if (CROSS_FIELD_OPS.has(operator)) {
    return (typeof val !== 'string' || !val) ? `${label}: target field is required` : null;
  }
  return (val === null || val === undefined || val === '') ? `${label}: value is required` : null;
}

function validateCondition(c: ConditionLike, label: string): string[] {
  const errs: string[] = [];
  if (!c.fieldKey) errs.push(`${label}: field is required`);
  if (!c.operator) errs.push(`${label}: operator is required`);
  if (NO_VALUE_OPERATORS.has(c.operator)) return errs;

  if (c.source.type === 'user_attribute') {
    if (!c.source.key) errs.push(`${label}: attribute key is required`);
    return errs;
  }

  const valueErr = validateStaticValue(label, c.operator, c.source.value);
  if (valueErr) errs.push(valueErr);
  return errs;
}

/**
 * Validate an array of filter conditions, returning per-index error messages.
 * Shared between UI (pre-save check) and can be mirrored in API validation.
 */
export function validateFilterConditions(conditions: ConditionLike[]): string[] {
  return conditions.flatMap((c, i) => validateCondition(c, `Condition ${i + 1}`));
}
