// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/tokenizer.ts.
// Keep in sync with upstream.

import type { Token } from './types';

const OPERATORS = new Set(['=', '!=', '>', '<', '>=', '<=', 'contains', 'notcontains']);
const UNARY_OPERATORS = new Set(['empty', 'notempty']);
const LOGICAL = new Set(['and', 'or']);
const FUNCTIONS = new Set([
  'iif', 'today', 'now', 'sum', 'count', 'min', 'max',
  'len', 'concat', 'abs', 'round', 'floor', 'ceil',
  'lower', 'upper', 'trim',
]);

export class TokenizerError extends Error {
  constructor(message: string, public position: number) {
    super(`Tokenizer error at position ${position}: ${message}`);
    this.name = 'TokenizerError';
  }
}

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr.charAt(i);

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '{') {
      const start = i;
      i++;
      let name = '';
      while (i < expr.length && expr.charAt(i) !== '}') {
        name += expr.charAt(i);
        i++;
      }
      if (i >= expr.length) {
        throw new TokenizerError('Unterminated field reference', start);
      }
      i++;
      tokens.push({ type: 'field_ref', value: name.trim(), position: start });
      continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = ch;
      const start = i;
      i++;
      let str = '';
      while (i < expr.length && expr.charAt(i) !== quote) {
        if (expr.charAt(i) === '\\' && i + 1 < expr.length) {
          i++;
          str += expr.charAt(i);
        } else {
          str += expr.charAt(i);
        }
        i++;
      }
      if (i >= expr.length) {
        throw new TokenizerError('Unterminated string literal', start);
      }
      i++;
      tokens.push({ type: 'string', value: str, position: start });
      continue;
    }

    const nextCh = expr.charAt(i + 1);
    const lastToken: Token | undefined = tokens[tokens.length - 1];
    if (
      /\d/.test(ch) ||
      (ch === '-' &&
        i + 1 < expr.length &&
        /\d/.test(nextCh) &&
        (tokens.length === 0 || (lastToken !== undefined && isOperatorLike(lastToken))))
    ) {
      const start = i;
      let num = '';
      if (ch === '-') {
        num += '-';
        i++;
      }
      while (i < expr.length && /[\d.]/.test(expr.charAt(i))) {
        num += expr.charAt(i);
        i++;
      }
      tokens.push({ type: 'number', value: num, position: start });
      continue;
    }

    if (ch === '!' && i + 1 < expr.length && expr.charAt(i + 1) === '=') {
      tokens.push({ type: 'operator', value: '!=', position: i });
      i += 2;
      continue;
    }
    if (ch === '>' && i + 1 < expr.length && expr.charAt(i + 1) === '=') {
      tokens.push({ type: 'operator', value: '>=', position: i });
      i += 2;
      continue;
    }
    if (ch === '<' && i + 1 < expr.length && expr.charAt(i + 1) === '=') {
      tokens.push({ type: 'operator', value: '<=', position: i });
      i += 2;
      continue;
    }

    if (ch === '=' || ch === '>' || ch === '<') {
      tokens.push({ type: 'operator', value: ch, position: i });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: '(', position: i });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')', position: i });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',', position: i });
      i++;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      let word = '';
      while (i < expr.length && /[a-zA-Z_0-9]/.test(expr.charAt(i))) {
        word += expr.charAt(i);
        i++;
      }
      const lower = word.toLowerCase();

      if (lower === 'true' || lower === 'false') {
        tokens.push({ type: 'boolean', value: lower, position: start });
      } else if (lower === 'null') {
        tokens.push({ type: 'null', value: 'null', position: start });
      } else if (lower === 'not') {
        tokens.push({ type: 'not', value: 'not', position: start });
      } else if (LOGICAL.has(lower)) {
        tokens.push({ type: 'logical', value: lower, position: start });
      } else if (OPERATORS.has(lower)) {
        tokens.push({ type: 'operator', value: lower, position: start });
      } else if (UNARY_OPERATORS.has(lower)) {
        tokens.push({ type: 'unary_operator', value: lower, position: start });
      } else if (FUNCTIONS.has(lower)) {
        tokens.push({ type: 'function', value: lower, position: start });
      } else {
        throw new TokenizerError(`Unknown identifier: ${word}`, start);
      }
      continue;
    }

    throw new TokenizerError(`Unexpected character: ${ch}`, i);
  }

  tokens.push({ type: 'eof', value: '', position: i });
  return tokens;
}

function isOperatorLike(token: Token): boolean {
  return (
    token.type === 'operator' ||
    token.type === 'logical' ||
    token.type === 'not' ||
    token.type === 'lparen' ||
    token.type === 'comma'
  );
}
