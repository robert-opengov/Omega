/* -------------------------------------------------------------------
 * Form Schema Types & Rule Engine
 * Pure domain types + logic, usable outside the DynamicForm component.
 * ----------------------------------------------------------------- */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'email'
  | 'phone'
  | 'url'
  | 'address'
  | 'combobox';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FormFieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  validation?: FieldValidation;
  /** Width span within a section grid (1-4, default 1) */
  span?: number;
}

export interface FormSection {
  key: string;
  label: string;
  order: number;
  description?: string;
  fields: FormFieldDef[];
  /** Number of columns for the section grid (default 1) */
  columns?: number;
}

export type RuleOperator = 'equals' | 'not_equals' | 'contains' | 'not_empty' | 'empty' | 'gt' | 'lt';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value?: string | number | boolean;
}

export type RuleActionType = 'show' | 'hide' | 'require' | 'disable';

export interface RuleAction {
  action: RuleActionType;
  target: string;
}

export interface FormRule {
  if: RuleCondition;
  then: RuleAction;
}

export interface FormSchema {
  version: number;
  sections: FormSection[];
  rules?: FormRule[];
}

// ----- Rule Engine -----

function evaluateCondition(condition: RuleCondition, values: Record<string, unknown>): boolean {
  const fieldValue = values[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains':
      return typeof fieldValue === 'string' && typeof condition.value === 'string'
        ? fieldValue.toLowerCase().includes(condition.value.toLowerCase())
        : false;
    case 'not_empty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'empty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    case 'gt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue > condition.value
        : false;
    case 'lt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        ? fieldValue < condition.value
        : false;
    default:
      return false;
  }
}

export interface RuleEvalResult {
  hiddenFields: Set<string>;
  requiredFields: Set<string>;
  disabledFields: Set<string>;
}

/**
 * Evaluate all form rules against current values.
 * Returns the set of hidden, required, and disabled field keys.
 */
export function evaluateRules(rules: FormRule[], values: Record<string, unknown>): RuleEvalResult {
  const hiddenFields = new Set<string>();
  const requiredFields = new Set<string>();
  const disabledFields = new Set<string>();

  for (const rule of rules) {
    const matches = evaluateCondition(rule.if, values);
    if (!matches) continue;

    switch (rule.then.action) {
      case 'show':
        hiddenFields.delete(rule.then.target);
        break;
      case 'hide':
        hiddenFields.add(rule.then.target);
        break;
      case 'require':
        requiredFields.add(rule.then.target);
        break;
      case 'disable':
        disabledFields.add(rule.then.target);
        break;
    }
  }

  return { hiddenFields, requiredFields, disabledFields };
}

/**
 * Validate a single field value against its definition.
 * Returns an error string or null if valid.
 */
export function validateField(def: FormFieldDef, value: unknown, isRequired: boolean): string | null {
  const isEmpty = value === undefined || value === null || value === '';

  if ((def.required || isRequired) && isEmpty) {
    return `${def.label} is required`;
  }

  if (isEmpty) return null;

  const v = def.validation;
  if (!v) return null;

  if (typeof value === 'string') {
    if (v.minLength && value.length < v.minLength) {
      return `Minimum ${v.minLength} characters`;
    }
    if (v.maxLength && value.length > v.maxLength) {
      return `Maximum ${v.maxLength} characters`;
    }
    if (v.pattern) {
      const re = new RegExp(v.pattern);
      if (!re.test(value)) {
        return v.patternMessage || 'Invalid format';
      }
    }
  }

  if (typeof value === 'number') {
    if (v.min !== undefined && value < v.min) return `Minimum value is ${v.min}`;
    if (v.max !== undefined && value > v.max) return `Maximum value is ${v.max}`;
  }

  return null;
}
