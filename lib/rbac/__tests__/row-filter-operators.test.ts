import { describe, expect, it } from 'vitest';
import {
  FILTER_OPERATORS,
  NO_VALUE_OPERATORS,
  getOperatorsForFieldType,
  validateFilterConditions,
  type ConditionLike,
} from '../row-filter-operators';

describe('row-filter-operators', () => {
  describe('getOperatorsForFieldType', () => {
    it('returns all operators when type is undefined', () => {
      expect(getOperatorsForFieldType(undefined)).toEqual(FILTER_OPERATORS);
    });

    it('returns all operators when type is unknown', () => {
      expect(getOperatorsForFieldType('alien')).toEqual(FILTER_OPERATORS);
    });

    it('limits operators for boolean fields', () => {
      const ops = getOperatorsForFieldType('boolean').map((o) => o.value);
      expect(ops).toContain('true_or_false');
      expect(ops).not.toContain('contains');
    });

    it('limits operators for number fields', () => {
      const ops = getOperatorsForFieldType('number').map((o) => o.value);
      expect(ops).toContain('greater_than');
      expect(ops).not.toContain('contains');
    });

    it('exposes date operators for datetime fields', () => {
      const ops = getOperatorsForFieldType('datetime').map((o) => o.value);
      expect(ops).toContain('between_date');
    });
  });

  describe('NO_VALUE_OPERATORS', () => {
    it('contains nullability + current-user shortcuts', () => {
      expect(NO_VALUE_OPERATORS.has('empty')).toBe(true);
      expect(NO_VALUE_OPERATORS.has('has_value')).toBe(true);
      expect(NO_VALUE_OPERATORS.has('current_user')).toBe(true);
      expect(NO_VALUE_OPERATORS.has('contains_current_user')).toBe(true);
    });
  });

  describe('validateFilterConditions', () => {
    it('returns no errors for valid conditions', () => {
      const conds: ConditionLike[] = [
        { fieldKey: 'name', operator: 'is_equal', source: { type: 'static', value: 'foo' } },
      ];
      expect(validateFilterConditions(conds)).toEqual([]);
    });

    it('flags missing field and operator', () => {
      const conds: ConditionLike[] = [
        { fieldKey: '', operator: '', source: { type: 'static', value: 'foo' } },
      ];
      const errs = validateFilterConditions(conds);
      expect(errs.some((e) => /field is required/.test(e))).toBe(true);
      expect(errs.some((e) => /operator is required/.test(e))).toBe(true);
    });

    it('skips value validation for no-value operators', () => {
      const conds: ConditionLike[] = [
        { fieldKey: 'name', operator: 'empty', source: { type: 'static' } },
      ];
      expect(validateFilterConditions(conds)).toEqual([]);
    });

    it('requires at least one item for the in operator', () => {
      const conds: ConditionLike[] = [
        { fieldKey: 'name', operator: 'in', source: { type: 'static', value: [] } },
      ];
      expect(validateFilterConditions(conds)).toEqual([
        'Condition 1: at least one value is required',
      ]);
    });

    it('requires both endpoints for between_date', () => {
      const conds: ConditionLike[] = [
        { fieldKey: 'created_at', operator: 'between_date', source: { type: 'static', value: { from: '2026-01-01' } } },
      ];
      const errs = validateFilterConditions(conds);
      expect(errs[0]).toMatch(/both from and to/);
    });

    it('requires a target field for cross-field operators', () => {
      const conds: ConditionLike[] = [
        { fieldKey: 'a', operator: 'equal_to_field_value', source: { type: 'static', value: '' } },
      ];
      const errs = validateFilterConditions(conds);
      expect(errs[0]).toMatch(/target field is required/);
    });

    it('requires user attribute key for user_attribute source', () => {
      const conds: ConditionLike[] = [
        { fieldKey: 'a', operator: 'is_equal', source: { type: 'user_attribute' } },
      ];
      const errs = validateFilterConditions(conds);
      expect(errs[0]).toMatch(/attribute key is required/);
    });
  });
});
