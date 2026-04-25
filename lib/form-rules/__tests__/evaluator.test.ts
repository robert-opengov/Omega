// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/evaluator.test.ts.

import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../engine';
import { EvaluationError } from '../evaluator';

function e(expr: string, ctx: Record<string, unknown> = {}): unknown {
  return evaluateExpression(expr, ctx);
}

describe('evaluator', () => {
  describe('literals', () => {
    it('evaluates numbers', () => {
      expect(e('42')).toBe(42);
      expect(e('3.14')).toBeCloseTo(3.14);
      expect(e('-5')).toBe(-5);
    });

    it('evaluates strings', () => {
      expect(e("'hello'")).toBe('hello');
    });

    it('evaluates booleans', () => {
      expect(e('true')).toBe(true);
      expect(e('false')).toBe(false);
    });

    it('evaluates null', () => {
      expect(e('null')).toBe(null);
    });
  });

  describe('field references', () => {
    it('resolves field from context', () => {
      expect(e('{Name}', { Name: 'Alice' })).toBe('Alice');
    });

    it('returns null for missing fields', () => {
      expect(e('{Missing}', {})).toBe(null);
    });

    it('handles fields with spaces', () => {
      expect(e('{First Name}', { 'First Name': 'Bob' })).toBe('Bob');
    });
  });

  describe('comparison operators', () => {
    it('= compares equal', () => {
      expect(e('{A} = 5', { A: 5 })).toBe(true);
      expect(e('{A} = 5', { A: 6 })).toBe(false);
    });

    it('= does case-insensitive string comparison', () => {
      expect(e("{A} = 'hello'", { A: 'HELLO' })).toBe(true);
    });

    it('= treats null = null as true', () => {
      expect(e('{A} = null', { A: null })).toBe(true);
    });

    it('= coerces number-string comparisons', () => {
      expect(e("{A} = '42'", { A: 42 })).toBe(true);
    });

    it('!= compares not equal', () => {
      expect(e('{A} != 5', { A: 6 })).toBe(true);
      expect(e('{A} != 5', { A: 5 })).toBe(false);
    });

    it('> compares greater than', () => {
      expect(e('{A} > 5', { A: 10 })).toBe(true);
      expect(e('{A} > 5', { A: 3 })).toBe(false);
    });

    it('< compares less than', () => {
      expect(e('{A} < 5', { A: 3 })).toBe(true);
    });

    it('>= compares greater or equal', () => {
      expect(e('{A} >= 5', { A: 5 })).toBe(true);
      expect(e('{A} >= 5', { A: 4 })).toBe(false);
    });

    it('<= compares less or equal', () => {
      expect(e('{A} <= 5', { A: 5 })).toBe(true);
      expect(e('{A} <= 5', { A: 6 })).toBe(false);
    });

    it('contains checks substring', () => {
      expect(e("{A} contains 'ell'", { A: 'Hello' })).toBe(true);
      expect(e("{A} contains 'xyz'", { A: 'Hello' })).toBe(false);
    });

    it('contains is case-insensitive', () => {
      expect(e("{A} contains 'ELL'", { A: 'hello' })).toBe(true);
    });

    it('notcontains checks no substring', () => {
      expect(e("{A} notcontains 'xyz'", { A: 'Hello' })).toBe(true);
      expect(e("{A} notcontains 'ell'", { A: 'Hello' })).toBe(false);
    });
  });

  describe('unary operators', () => {
    it('empty returns true for null/undefined/empty string', () => {
      expect(e('{A} empty', { A: null })).toBe(true);
      expect(e('{A} empty', { A: '' })).toBe(true);
      expect(e('{A} empty', {})).toBe(true);
    });

    it('empty returns true for empty array', () => {
      expect(e('{A} empty', { A: [] })).toBe(true);
    });

    it('empty returns false for non-empty values', () => {
      expect(e('{A} empty', { A: 'x' })).toBe(false);
      expect(e('{A} empty', { A: 0 })).toBe(false);
      expect(e('{A} empty', { A: false })).toBe(false);
    });

    it('notempty is the inverse of empty', () => {
      expect(e('{A} notempty', { A: 'hello' })).toBe(true);
      expect(e('{A} notempty', { A: null })).toBe(false);
    });
  });

  describe('logical operators', () => {
    it('and requires both sides true', () => {
      expect(e('{A} = 1 and {B} = 2', { A: 1, B: 2 })).toBe(true);
      expect(e('{A} = 1 and {B} = 2', { A: 1, B: 3 })).toBe(false);
    });

    it('or requires either side true', () => {
      expect(e('{A} = 1 or {B} = 2', { A: 1, B: 3 })).toBe(true);
      expect(e('{A} = 1 or {B} = 2', { A: 3, B: 3 })).toBe(false);
    });

    it('and short-circuits (false && anything = false)', () => {
      expect(e('{A} = 1 and {B} = 2', { A: 99, B: 2 })).toBe(false);
    });

    it('or short-circuits (true || anything = true)', () => {
      expect(e('{A} = 1 or {B} = 2', { A: 1, B: 99 })).toBe(true);
    });

    it('not negates', () => {
      expect(e('not {A} = 1', { A: 1 })).toBe(false);
      expect(e('not {A} = 1', { A: 2 })).toBe(true);
    });

    it('complex: (A and B) or C', () => {
      expect(e('({A} = 1 and {B} = 2) or {C} = 3', { A: 1, B: 2, C: 9 })).toBe(true);
      expect(e('({A} = 1 and {B} = 2) or {C} = 3', { A: 9, B: 9, C: 3 })).toBe(true);
      expect(e('({A} = 1 and {B} = 2) or {C} = 3', { A: 9, B: 9, C: 9 })).toBe(false);
    });
  });

  describe('functions', () => {
    describe('iif', () => {
      it('returns trueVal when condition is true', () => {
        expect(e("iif({A} = 1, 'yes', 'no')", { A: 1 })).toBe('yes');
      });

      it('returns falseVal when condition is false', () => {
        expect(e("iif({A} = 1, 'yes', 'no')", { A: 2 })).toBe('no');
      });

      it('works with numeric results', () => {
        expect(e('iif({A} > 100, {A}, 0)', { A: 200 })).toBe(200);
        expect(e('iif({A} > 100, {A}, 0)', { A: 50 })).toBe(0);
      });

      it('throws with wrong arg count', () => {
        expect(() => e('iif({A}, 1)')).toThrow(EvaluationError);
      });
    });

    describe('today', () => {
      it('returns YYYY-MM-DD string', () => {
        const result = e('today()') as string;
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    describe('now', () => {
      it('returns ISO string', () => {
        const result = e('now()') as string;
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    describe('sum', () => {
      it('sums numeric arguments', () => {
        expect(e('sum({A}, {B}, {C})', { A: 10, B: 20, C: 30 })).toBe(60);
      });

      it('coerces strings to numbers', () => {
        expect(e('sum({A}, {B})', { A: '10', B: 20 })).toBe(30);
      });

      it('treats null as 0', () => {
        expect(e('sum({A}, {B})', { A: 10 })).toBe(10);
      });
    });

    describe('count', () => {
      it('counts non-empty arguments', () => {
        expect(e('count({A}, {B}, {C})', { A: 'x', B: null, C: 0 })).toBe(2);
      });

      it('counts array lengths', () => {
        expect(e('count({Items})', { Items: [1, 2, 3] })).toBe(3);
      });
    });

    describe('min / max', () => {
      it('min returns smallest', () => {
        expect(e('min({A}, {B}, {C})', { A: 5, B: 2, C: 8 })).toBe(2);
      });

      it('max returns largest', () => {
        expect(e('max({A}, {B}, {C})', { A: 5, B: 2, C: 8 })).toBe(8);
      });
    });

    describe('abs', () => {
      it('returns absolute value', () => {
        expect(e('abs({A})', { A: -42 })).toBe(42);
        expect(e('abs({A})', { A: 42 })).toBe(42);
      });
    });

    describe('round / floor / ceil', () => {
      it('round to nearest integer by default', () => {
        expect(e('round({A})', { A: 3.7 })).toBe(4);
        expect(e('round({A})', { A: 3.2 })).toBe(3);
      });

      it('round to specified decimal places', () => {
        expect(e('round({A}, 2)', { A: 3.14159 })).toBeCloseTo(3.14);
      });

      it('floor rounds down', () => {
        expect(e('floor({A})', { A: 3.9 })).toBe(3);
      });

      it('ceil rounds up', () => {
        expect(e('ceil({A})', { A: 3.1 })).toBe(4);
      });
    });

    describe('len', () => {
      it('returns string length', () => {
        expect(e('len({A})', { A: 'hello' })).toBe(5);
      });

      it('returns array length', () => {
        expect(e('len({A})', { A: [1, 2, 3] })).toBe(3);
      });

      it('returns 0 for null', () => {
        expect(e('len({A})', { A: null })).toBe(0);
      });
    });

    describe('concat', () => {
      it('concatenates strings', () => {
        expect(e("concat({First}, ' ', {Last})", { First: 'John', Last: 'Doe' })).toBe('John Doe');
      });

      it('coerces non-strings', () => {
        expect(e("concat({A}, '-', {B})", { A: 10, B: 20 })).toBe('10-20');
      });
    });

    describe('lower / upper / trim', () => {
      it('lower converts to lowercase', () => {
        expect(e('lower({A})', { A: 'HELLO' })).toBe('hello');
      });

      it('upper converts to uppercase', () => {
        expect(e('upper({A})', { A: 'hello' })).toBe('HELLO');
      });

      it('trim removes whitespace', () => {
        expect(e('trim({A})', { A: '  hello  ' })).toBe('hello');
      });
    });
  });

  describe('real-world expressions', () => {
    const ctx = {
      Category: 'Travel',
      Amount: 750,
      Status: 'Pending',
      Description: 'Flight to NYC',
      Quantity: 3,
      UnitPrice: 25.5,
    };

    it('category equals Travel and amount > 500', () => {
      expect(e("{Category} = 'Travel' and {Amount} > 500", ctx)).toBe(true);
    });

    it('status is notempty', () => {
      expect(e('{Status} notempty', ctx)).toBe(true);
    });

    it('calculated line total', () => {
      expect(e('sum({Quantity}, {UnitPrice})', ctx)).toBeCloseTo(28.5);
    });

    it('conditional discount', () => {
      expect(e('iif({Amount} > 500, {Amount}, 0)', ctx)).toBe(750);
    });

    it('complex nested logic', () => {
      const expr =
        "({Category} = 'Travel' or {Category} = 'Meals') and {Amount} > 100 and {Status} != 'Approved'";
      expect(e(expr, ctx)).toBe(true);
    });

    it('description contains flight', () => {
      expect(e("{Description} contains 'flight'", ctx)).toBe(true);
    });

    it('string manipulation', () => {
      expect(e('upper({Category})', ctx)).toBe('TRAVEL');
    });

    it('nested function: round of absolute value', () => {
      expect(e('round(abs({Amount}), 0)', ctx)).toBe(750);
    });
  });
});
