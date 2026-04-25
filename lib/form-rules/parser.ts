// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/parser.ts.
// Keep in sync with upstream.

import type { ASTNode, Token } from './types';

export class ParseError extends Error {
  constructor(message: string, public position: number) {
    super(`Parse error at position ${position}: ${message}`);
    this.name = 'ParseError';
  }
}

/**
 * Recursive descent parser for the rules expression language.
 *
 * Precedence (lowest to highest):
 *   1. or
 *   2. and
 *   3. not
 *   4. comparison (=, !=, >, <, >=, <=, contains, notcontains)
 *   5. unary postfix (empty, notempty)
 *   6. primary (literal, field ref, function call, parenthesized expr)
 */
export function parse(tokens: Token[]): ASTNode {
  let pos = 0;

  const syntheticEof: Token = {
    type: 'eof',
    value: '',
    position: tokens.length > 0 ? tokens[tokens.length - 1]?.position ?? 0 : 0,
  };

  function peek(): Token {
    return tokens[pos] ?? syntheticEof;
  }

  function advance(): Token {
    if (pos >= tokens.length) return syntheticEof;
    return tokens[pos++]!;
  }

  function expect(type: string, value?: string): Token {
    const t = peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new ParseError(
        `Expected ${type}${value ? ` '${value}'` : ''}, got ${t.type} '${t.value}'`,
        t.position,
      );
    }
    return advance();
  }

  function parseOr(): ASTNode {
    let left = parseAnd();
    while (peek().type === 'logical' && peek().value === 'or') {
      advance();
      const right = parseAnd();
      left = { kind: 'logical', operator: 'or', left, right };
    }
    return left;
  }

  function parseAnd(): ASTNode {
    let left = parseNot();
    while (peek().type === 'logical' && peek().value === 'and') {
      advance();
      const right = parseNot();
      left = { kind: 'logical', operator: 'and', left, right };
    }
    return left;
  }

  function parseNot(): ASTNode {
    if (peek().type === 'not') {
      advance();
      const operand = parseNot();
      return { kind: 'not', operand };
    }
    return parseComparison();
  }

  function parseComparison(): ASTNode {
    const left = parseUnary();
    if (peek().type === 'operator') {
      const op = advance().value;
      const right = parseUnary();
      return { kind: 'binary_op', operator: op, left, right };
    }
    return left;
  }

  function parseUnary(): ASTNode {
    const operand = parsePrimary();
    if (peek().type === 'unary_operator') {
      const op = advance().value as 'empty' | 'notempty';
      return { kind: 'unary_op', operator: op, operand };
    }
    return operand;
  }

  function parsePrimary(): ASTNode {
    const t = peek();

    if (t.type === 'field_ref') {
      advance();
      return { kind: 'field_ref', name: t.value };
    }

    if (t.type === 'number') {
      advance();
      return { kind: 'literal', value: parseFloat(t.value) };
    }

    if (t.type === 'string') {
      advance();
      return { kind: 'literal', value: t.value };
    }

    if (t.type === 'boolean') {
      advance();
      return { kind: 'literal', value: t.value === 'true' };
    }

    if (t.type === 'null') {
      advance();
      return { kind: 'literal', value: null };
    }

    if (t.type === 'function') {
      const name = advance().value;
      expect('lparen');
      const args: ASTNode[] = [];
      if (peek().type !== 'rparen') {
        args.push(parseOr());
        while (peek().type === 'comma') {
          advance();
          args.push(parseOr());
        }
      }
      expect('rparen');
      return { kind: 'function_call', name, args };
    }

    if (t.type === 'lparen') {
      advance();
      const expr = parseOr();
      expect('rparen');
      return expr;
    }

    throw new ParseError(`Unexpected token: ${t.type} '${t.value}'`, t.position);
  }

  const ast = parseOr();

  if (peek().type !== 'eof') {
    const t = peek();
    throw new ParseError(`Unexpected token after expression: ${t.type} '${t.value}'`, t.position);
  }

  return ast;
}
