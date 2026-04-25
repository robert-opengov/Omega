// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/parser.test.ts.

import { describe, it, expect } from 'vitest';
import { tokenize } from '../tokenizer';
import { parse, ParseError } from '../parser';
import type { ASTNode } from '../types';

function p(expr: string): ASTNode {
  return parse(tokenize(expr));
}

describe('parser', () => {
  describe('literals', () => {
    it('parses number', () => {
      expect(p('42')).toEqual({ kind: 'literal', value: 42 });
    });

    it('parses string', () => {
      expect(p("'hello'")).toEqual({ kind: 'literal', value: 'hello' });
    });

    it('parses boolean', () => {
      expect(p('true')).toEqual({ kind: 'literal', value: true });
      expect(p('false')).toEqual({ kind: 'literal', value: false });
    });

    it('parses null', () => {
      expect(p('null')).toEqual({ kind: 'literal', value: null });
    });
  });

  describe('field references', () => {
    it('parses field ref', () => {
      expect(p('{Name}')).toEqual({ kind: 'field_ref', name: 'Name' });
    });
  });

  describe('binary operators', () => {
    it('parses equality', () => {
      const ast = p('{A} = 1');
      expect(ast).toEqual({
        kind: 'binary_op',
        operator: '=',
        left: { kind: 'field_ref', name: 'A' },
        right: { kind: 'literal', value: 1 },
      });
    });

    it('parses all comparison operators', () => {
      for (const op of ['=', '!=', '>', '<', '>=', '<=', 'contains', 'notcontains']) {
        const ast = p(`{A} ${op} 'x'`);
        expect(ast.kind).toBe('binary_op');
        if (ast.kind === 'binary_op') {
          expect(ast.operator).toBe(op);
        }
      }
    });
  });

  describe('unary operators', () => {
    it('parses empty', () => {
      const ast = p('{A} empty');
      expect(ast).toEqual({
        kind: 'unary_op',
        operator: 'empty',
        operand: { kind: 'field_ref', name: 'A' },
      });
    });

    it('parses notempty', () => {
      const ast = p('{A} notempty');
      expect(ast).toEqual({
        kind: 'unary_op',
        operator: 'notempty',
        operand: { kind: 'field_ref', name: 'A' },
      });
    });
  });

  describe('logical operators', () => {
    it('parses and', () => {
      const ast = p('{A} = 1 and {B} = 2');
      expect(ast.kind).toBe('logical');
      if (ast.kind === 'logical') {
        expect(ast.operator).toBe('and');
      }
    });

    it('parses or', () => {
      const ast = p('{A} = 1 or {B} = 2');
      expect(ast.kind).toBe('logical');
      if (ast.kind === 'logical') {
        expect(ast.operator).toBe('or');
      }
    });

    it('and has higher precedence than or', () => {
      const ast = p('{A} = 1 or {B} = 2 and {C} = 3');
      expect(ast.kind).toBe('logical');
      if (ast.kind === 'logical') {
        expect(ast.operator).toBe('or');
        expect(ast.right.kind).toBe('logical');
        if (ast.right.kind === 'logical') {
          expect(ast.right.operator).toBe('and');
        }
      }
    });

    it('parses not', () => {
      const ast = p('not {A} = 1');
      expect(ast.kind).toBe('not');
    });

    it('parses double not', () => {
      const ast = p('not not true');
      expect(ast).toEqual({
        kind: 'not',
        operand: { kind: 'not', operand: { kind: 'literal', value: true } },
      });
    });
  });

  describe('parenthesized expressions', () => {
    it('overrides precedence', () => {
      const ast = p('({A} = 1 or {B} = 2) and {C} = 3');
      expect(ast.kind).toBe('logical');
      if (ast.kind === 'logical') {
        expect(ast.operator).toBe('and');
        expect(ast.left.kind).toBe('logical');
        if (ast.left.kind === 'logical') {
          expect(ast.left.operator).toBe('or');
        }
      }
    });
  });

  describe('function calls', () => {
    it('parses zero-arg function', () => {
      const ast = p('today()');
      expect(ast).toEqual({ kind: 'function_call', name: 'today', args: [] });
    });

    it('parses single-arg function', () => {
      const ast = p('abs({Amount})');
      expect(ast).toEqual({
        kind: 'function_call',
        name: 'abs',
        args: [{ kind: 'field_ref', name: 'Amount' }],
      });
    });

    it('parses multi-arg function', () => {
      const ast = p("iif({A} = 1, 'yes', 'no')");
      expect(ast.kind).toBe('function_call');
      if (ast.kind === 'function_call') {
        expect(ast.name).toBe('iif');
        expect(ast.args).toHaveLength(3);
      }
    });

    it('parses nested function calls', () => {
      const ast = p('round(abs({Amount}), 2)');
      expect(ast.kind).toBe('function_call');
      if (ast.kind === 'function_call') {
        expect(ast.name).toBe('round');
        expect(ast.args).toHaveLength(2);
        expect(ast.args[0]?.kind).toBe('function_call');
      }
    });
  });

  describe('complex expressions', () => {
    it('parses a real-world rule expression', () => {
      const ast = p("{Category} = 'Travel' and {Amount} > 500");
      expect(ast.kind).toBe('logical');
    });

    it('parses nested logical with parentheses', () => {
      const ast = p('({A} = 1 and {B} = 2) or ({C} = 3 and {D} = 4)');
      expect(ast.kind).toBe('logical');
    });
  });

  describe('errors', () => {
    it('throws on unexpected token', () => {
      expect(() => p('= 1')).toThrow(ParseError);
    });

    it('throws on extra tokens after expression', () => {
      expect(() => p('1 2')).toThrow(ParseError);
    });

    it('throws on unmatched parenthesis', () => {
      expect(() => p('(1')).toThrow(ParseError);
    });

    it('throws on missing function arguments close paren', () => {
      expect(() => p('iif({A}, 1, 2')).toThrow(ParseError);
    });
  });
});
