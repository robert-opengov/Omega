// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/tokenizer.test.ts.

import { describe, it, expect } from 'vitest';
import { tokenize, TokenizerError } from '../tokenizer';
import type { Token } from '../types';

describe('tokenizer', () => {
  describe('field references', () => {
    it('tokenizes a simple field reference', () => {
      const tokens = tokenize('{Name}');
      expect(tokens[0]).toMatchObject({ type: 'field_ref', value: 'Name' });
    });

    it('trims whitespace inside braces', () => {
      const tokens = tokenize('{ First Name }');
      expect(tokens[0]).toMatchObject({ type: 'field_ref', value: 'First Name' });
    });

    it('throws on unterminated field reference', () => {
      expect(() => tokenize('{Name')).toThrow(TokenizerError);
    });
  });

  describe('string literals', () => {
    it('tokenizes single-quoted strings', () => {
      const tokens = tokenize("'hello'");
      expect(tokens[0]).toMatchObject({ type: 'string', value: 'hello' });
    });

    it('tokenizes double-quoted strings', () => {
      const tokens = tokenize('"world"');
      expect(tokens[0]).toMatchObject({ type: 'string', value: 'world' });
    });

    it('handles escaped quotes', () => {
      const tokens = tokenize("'it\\'s'");
      expect(tokens[0]).toMatchObject({ type: 'string', value: "it's" });
    });

    it('handles empty strings', () => {
      const tokens = tokenize("''");
      expect(tokens[0]).toMatchObject({ type: 'string', value: '' });
    });

    it('throws on unterminated string', () => {
      expect(() => tokenize("'hello")).toThrow(TokenizerError);
    });
  });

  describe('number literals', () => {
    it('tokenizes integers', () => {
      const tokens = tokenize('42');
      expect(tokens[0]).toMatchObject({ type: 'number', value: '42' });
    });

    it('tokenizes decimals', () => {
      const tokens = tokenize('3.14');
      expect(tokens[0]).toMatchObject({ type: 'number', value: '3.14' });
    });

    it('tokenizes negative numbers at start of expression', () => {
      const tokens = tokenize('-5');
      expect(tokens[0]).toMatchObject({ type: 'number', value: '-5' });
    });

    it('tokenizes negative numbers after an operator', () => {
      const tokens = tokenize('{Amount} = -10');
      expect(tokens[2]).toMatchObject({ type: 'number', value: '-10' });
    });
  });

  describe('boolean and null literals', () => {
    it('tokenizes true', () => {
      const tokens = tokenize('true');
      expect(tokens[0]).toMatchObject({ type: 'boolean', value: 'true' });
    });

    it('tokenizes false (case-insensitive)', () => {
      const tokens = tokenize('False');
      expect(tokens[0]).toMatchObject({ type: 'boolean', value: 'false' });
    });

    it('tokenizes null', () => {
      const tokens = tokenize('null');
      expect(tokens[0]).toMatchObject({ type: 'null', value: 'null' });
    });
  });

  describe('operators', () => {
    it('tokenizes single-char operators', () => {
      for (const op of ['=', '>', '<']) {
        const tokens = tokenize(`{A} ${op} 1`);
        expect(tokens[1]).toMatchObject({ type: 'operator', value: op });
      }
    });

    it('tokenizes multi-char operators', () => {
      for (const op of ['!=', '>=', '<=']) {
        const tokens = tokenize(`{A} ${op} 1`);
        expect(tokens[1]).toMatchObject({ type: 'operator', value: op });
      }
    });

    it('tokenizes word operators', () => {
      for (const op of ['contains', 'notcontains']) {
        const tokens = tokenize(`{A} ${op} 'x'`);
        expect(tokens[1]).toMatchObject({ type: 'operator', value: op });
      }
    });

    it('tokenizes unary operators', () => {
      for (const op of ['empty', 'notempty']) {
        const tokens = tokenize(`{A} ${op}`);
        expect(tokens[1]).toMatchObject({ type: 'unary_operator', value: op });
      }
    });
  });

  describe('logical operators', () => {
    it('tokenizes and/or', () => {
      const tokens = tokenize('{A} = 1 and {B} = 2 or {C} = 3');
      expect(tokens[3]).toMatchObject({ type: 'logical', value: 'and' });
      expect(tokens[7]).toMatchObject({ type: 'logical', value: 'or' });
    });

    it('tokenizes not', () => {
      const tokens = tokenize('not {A} = 1');
      expect(tokens[0]).toMatchObject({ type: 'not', value: 'not' });
    });
  });

  describe('functions', () => {
    it('tokenizes known functions', () => {
      const fns = [
        'iif', 'today', 'now', 'sum', 'count', 'min', 'max',
        'len', 'concat', 'abs', 'round', 'floor', 'ceil',
        'lower', 'upper', 'trim',
      ];
      for (const fn of fns) {
        const tokens = tokenize(`${fn}()`);
        expect(tokens[0]).toMatchObject({ type: 'function', value: fn });
      }
    });
  });

  describe('punctuation', () => {
    it('tokenizes parentheses and commas', () => {
      const tokens = tokenize('iif({A}, 1, 2)');
      expect(tokens[1]).toMatchObject({ type: 'lparen' });
      expect(tokens[3]).toMatchObject({ type: 'comma' });
      expect(tokens[5]).toMatchObject({ type: 'comma' });
      expect(tokens[7]).toMatchObject({ type: 'rparen' });
    });
  });

  describe('complex expressions', () => {
    it('tokenizes a full rule expression', () => {
      const expr = "{Category} = 'Travel' and {Amount} > 500";
      const tokens = tokenize(expr);
      const types = tokens.map((t) => t.type);
      expect(types).toEqual([
        'field_ref', 'operator', 'string', 'logical',
        'field_ref', 'operator', 'number', 'eof',
      ]);
    });

    it('always ends with EOF', () => {
      const tokens = tokenize('1');
      const last: Token | undefined = tokens[tokens.length - 1];
      expect(last).toBeDefined();
      expect(last!.type).toBe('eof');
    });
  });

  describe('errors', () => {
    it('throws on unknown identifiers', () => {
      expect(() => tokenize('foobar')).toThrow(TokenizerError);
    });

    it('throws on unexpected characters', () => {
      expect(() => tokenize('@')).toThrow(TokenizerError);
    });

    it('records position in error', () => {
      try {
        tokenize('   @');
      } catch (e) {
        expect(e).toBeInstanceOf(TokenizerError);
        expect((e as TokenizerError).position).toBe(3);
      }
    });
  });
});
