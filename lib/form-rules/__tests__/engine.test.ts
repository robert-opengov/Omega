// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/engine.test.ts.

import { describe, it, expect } from 'vitest';
import {
  evaluateExpression,
  compileExpression,
  evaluateAST,
  evaluateFormRules,
  extractFieldReferences,
} from '../engine';
import type { FormRule } from '../types';

describe('engine', () => {
  describe('evaluateExpression', () => {
    it('parses and evaluates in one call', () => {
      expect(evaluateExpression('{A} > 10', { A: 20 })).toBe(true);
    });
  });

  describe('compileExpression + evaluateAST', () => {
    it('compiles once, evaluates many times', () => {
      const ast = compileExpression('{Price} > 100');
      expect(evaluateAST(ast, { Price: 200 })).toBe(true);
      expect(evaluateAST(ast, { Price: 50 })).toBe(false);
      expect(evaluateAST(ast, { Price: 100 })).toBe(false);
    });
  });

  describe('extractFieldReferences', () => {
    it('extracts all field names', () => {
      const fields = extractFieldReferences('{A} = 1 and {B} > {C}');
      expect(fields).toEqual(['A', 'B', 'C']);
    });

    it('returns empty array for no fields', () => {
      expect(extractFieldReferences('1 = 1')).toEqual([]);
    });

    it('includes duplicate references', () => {
      const fields = extractFieldReferences('{A} = {A}');
      expect(fields).toEqual(['A', 'A']);
    });
  });

  describe('evaluateFormRules', () => {
    it('evaluates visibility rules', () => {
      const rules: FormRule[] = [
        { id: 'r1', type: 'visibility', targetItemId: 'travelSection', expression: "{Category} = 'Travel'" },
        { id: 'r2', type: 'visibility', targetItemId: 'mealsSection', expression: "{Category} = 'Meals'" },
      ];
      const result = evaluateFormRules(rules, { Category: 'Travel' });

      expect(result.visibility.get('travelSection')).toBe(true);
      expect(result.visibility.get('mealsSection')).toBe(false);
    });

    it('evaluates required rules', () => {
      const rules: FormRule[] = [
        { id: 'r1', type: 'required', targetItemId: 'receiptField', expression: '{Amount} > 25' },
      ];
      const result = evaluateFormRules(rules, { Amount: 100 });
      expect(result.required.get('receiptField')).toBe(true);

      const result2 = evaluateFormRules(rules, { Amount: 10 });
      expect(result2.required.get('receiptField')).toBe(false);
    });

    it('evaluates readOnly rules', () => {
      const rules: FormRule[] = [
        { id: 'r1', type: 'readOnly', targetItemId: 'totalField', expression: "{Status} = 'Approved'" },
      ];
      const result = evaluateFormRules(rules, { Status: 'Approved' });
      expect(result.readOnly.get('totalField')).toBe(true);
    });

    it('evaluates setValue rules', () => {
      const rules: FormRule[] = [
        {
          id: 'r1',
          type: 'setValue',
          targetItemId: 'taxField',
          expression: '{Amount} notempty',
          valueExpression: 'round({Amount}, 2)',
        },
      ];
      const result = evaluateFormRules(rules, { Amount: 99.999 });
      expect(result.values.get('taxField')).toBeCloseTo(100);
    });

    it('does not set value when condition is false', () => {
      const rules: FormRule[] = [
        {
          id: 'r1',
          type: 'setValue',
          targetItemId: 'taxField',
          expression: '{Amount} > 1000',
          valueExpression: 'round({Amount}, 2)',
        },
      ];
      const result = evaluateFormRules(rules, { Amount: 50 });
      expect(result.values.has('taxField')).toBe(false);
    });

    it('evaluates validation rules', () => {
      const rules: FormRule[] = [
        {
          id: 'r1',
          type: 'validation',
          targetItemId: 'amountField',
          expression: '{Amount} > 0',
          errorMessage: 'Amount must be positive',
        },
      ];

      const result1 = evaluateFormRules(rules, { Amount: 0 });
      expect(result1.errors.get('amountField')).toBe('Amount must be positive');

      const result2 = evaluateFormRules(rules, { Amount: 10 });
      expect(result2.errors.has('amountField')).toBe(false);
    });

    it('handles multiple rule types on the same target', () => {
      const rules: FormRule[] = [
        { id: 'r1', type: 'visibility', targetItemId: 'field1', expression: '{Show} = true' },
        { id: 'r2', type: 'required', targetItemId: 'field1', expression: '{Show} = true' },
        {
          id: 'r3',
          type: 'validation',
          targetItemId: 'field1',
          expression: '{Value} notempty',
          errorMessage: 'Required when visible',
        },
      ];

      const result = evaluateFormRules(rules, { Show: true, Value: '' });
      expect(result.visibility.get('field1')).toBe(true);
      expect(result.required.get('field1')).toBe(true);
      expect(result.errors.get('field1')).toBe('Required when visible');
    });

    it('gracefully handles invalid expressions', () => {
      const rules: FormRule[] = [
        { id: 'r1', type: 'visibility', targetItemId: 'field1', expression: 'THIS IS INVALID @@#$' },
        { id: 'r2', type: 'visibility', targetItemId: 'field2', expression: '{A} = 1' },
      ];

      const result = evaluateFormRules(rules, { A: 1 });
      expect(result.visibility.has('field1')).toBe(false);
      expect(result.visibility.get('field2')).toBe(true);
    });

    it('evaluates a realistic set of rules', () => {
      const rules: FormRule[] = [
        {
          id: 'show_travel',
          type: 'visibility',
          targetItemId: 'travelDates',
          expression: "{Category} = 'Travel'",
        },
        {
          id: 'require_receipt',
          type: 'required',
          targetItemId: 'receipt',
          expression: '{Amount} > 25',
        },
        {
          id: 'calc_total',
          type: 'setValue',
          targetItemId: 'total',
          expression: '{Quantity} notempty and {UnitPrice} notempty',
          valueExpression: 'sum({Quantity}, {UnitPrice})',
        },
        {
          id: 'validate_amount',
          type: 'validation',
          targetItemId: 'amount',
          expression: '{Amount} > 0',
          errorMessage: 'Amount must be greater than zero',
        },
        {
          id: 'lock_approved',
          type: 'readOnly',
          targetItemId: 'amount',
          expression: "{Status} = 'Approved'",
        },
      ];

      const ctx = {
        Category: 'Travel',
        Amount: 100,
        Quantity: 5,
        UnitPrice: 20,
        Status: 'Draft',
      };

      const result = evaluateFormRules(rules, ctx);
      expect(result.visibility.get('travelDates')).toBe(true);
      expect(result.required.get('receipt')).toBe(true);
      expect(result.values.get('total')).toBe(25);
      expect(result.errors.has('amount')).toBe(false);
      expect(result.readOnly.get('amount')).toBe(false);
    });
  });
});
