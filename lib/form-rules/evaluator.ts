// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/evaluator.ts.
// Keep in sync with upstream.

import type { ASTNode, ExpressionContext } from './types';

export class EvaluationError extends Error {
  constructor(message: string) {
    super(`Evaluation error: ${message}`);
    this.name = 'EvaluationError';
  }
}

export function evaluate(ast: ASTNode, context: ExpressionContext): unknown {
  switch (ast.kind) {
    case 'literal':
      return ast.value;

    case 'field_ref':
      return context[ast.name] ?? null;

    case 'binary_op':
      return evaluateBinaryOp(ast.operator, ast.left, ast.right, context);

    case 'unary_op':
      return evaluateUnaryOp(ast.operator, ast.operand, context);

    case 'logical':
      return evaluateLogical(ast.operator, ast.left, ast.right, context);

    case 'not':
      return !toBool(evaluate(ast.operand, context));

    case 'function_call':
      return evaluateFunction(ast.name, ast.args, context);
  }
}

function evaluateBinaryOp(
  op: string,
  leftNode: ASTNode,
  rightNode: ASTNode,
  ctx: ExpressionContext,
): unknown {
  const left = evaluate(leftNode, ctx);
  const right = evaluate(rightNode, ctx);

  switch (op) {
    case '=':
      return looseEqual(left, right);
    case '!=':
      return !looseEqual(left, right);
    case '>':
      return toNum(left) > toNum(right);
    case '<':
      return toNum(left) < toNum(right);
    case '>=':
      return toNum(left) >= toNum(right);
    case '<=':
      return toNum(left) <= toNum(right);
    case 'contains':
      return toStr(left).toLowerCase().includes(toStr(right).toLowerCase());
    case 'notcontains':
      return !toStr(left).toLowerCase().includes(toStr(right).toLowerCase());
    default:
      throw new EvaluationError(`Unknown operator: ${op}`);
  }
}

function evaluateUnaryOp(
  op: 'empty' | 'notempty',
  operandNode: ASTNode,
  ctx: ExpressionContext,
): boolean {
  const val = evaluate(operandNode, ctx);
  const isEmpty =
    val === null ||
    val === undefined ||
    val === '' ||
    (Array.isArray(val) && val.length === 0);

  return op === 'empty' ? isEmpty : !isEmpty;
}

function evaluateLogical(
  op: 'and' | 'or',
  leftNode: ASTNode,
  rightNode: ASTNode,
  ctx: ExpressionContext,
): boolean {
  const left = toBool(evaluate(leftNode, ctx));
  if (op === 'and') {
    return left ? toBool(evaluate(rightNode, ctx)) : false;
  }
  return left ? true : toBool(evaluate(rightNode, ctx));
}

function evaluateFunction(
  name: string,
  argNodes: ASTNode[],
  ctx: ExpressionContext,
): unknown {
  function arg(i: number): ASTNode {
    const n = argNodes[i];
    if (n === undefined) throw new EvaluationError(`${name}() missing argument at index ${i}`);
    return n;
  }

  switch (name) {
    case 'iif': {
      if (argNodes.length !== 3) {
        throw new EvaluationError('iif() requires exactly 3 arguments');
      }
      const condition = toBool(evaluate(arg(0), ctx));
      return condition ? evaluate(arg(1), ctx) : evaluate(arg(2), ctx);
    }

    case 'today': {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    case 'now': {
      return new Date().toISOString();
    }

    case 'sum': {
      return argNodes.reduce((acc, node) => acc + toNum(evaluate(node, ctx)), 0);
    }

    case 'count': {
      return argNodes.reduce((acc, node) => {
        const val = evaluate(node, ctx);
        if (Array.isArray(val)) return acc + val.length;
        if (val !== null && val !== undefined && val !== '') return acc + 1;
        return acc;
      }, 0);
    }

    case 'min': {
      const vals = argNodes.map((n) => toNum(evaluate(n, ctx)));
      return vals.length === 0 ? 0 : Math.min(...vals);
    }

    case 'max': {
      const vals = argNodes.map((n) => toNum(evaluate(n, ctx)));
      return vals.length === 0 ? 0 : Math.max(...vals);
    }

    case 'abs': {
      if (argNodes.length !== 1) throw new EvaluationError('abs() requires 1 argument');
      return Math.abs(toNum(evaluate(arg(0), ctx)));
    }

    case 'round': {
      if (argNodes.length < 1 || argNodes.length > 2)
        throw new EvaluationError('round() requires 1-2 arguments');
      const val = toNum(evaluate(arg(0), ctx));
      const decimals = argNodes.length === 2 ? toNum(evaluate(arg(1), ctx)) : 0;
      const factor = Math.pow(10, decimals);
      return Math.round(val * factor) / factor;
    }

    case 'floor': {
      if (argNodes.length !== 1) throw new EvaluationError('floor() requires 1 argument');
      return Math.floor(toNum(evaluate(arg(0), ctx)));
    }

    case 'ceil': {
      if (argNodes.length !== 1) throw new EvaluationError('ceil() requires 1 argument');
      return Math.ceil(toNum(evaluate(arg(0), ctx)));
    }

    case 'len': {
      if (argNodes.length !== 1) throw new EvaluationError('len() requires 1 argument');
      const val = evaluate(arg(0), ctx);
      if (Array.isArray(val)) return val.length;
      return toStr(val).length;
    }

    case 'concat': {
      return argNodes.map((n) => toStr(evaluate(n, ctx))).join('');
    }

    case 'lower': {
      if (argNodes.length !== 1) throw new EvaluationError('lower() requires 1 argument');
      return toStr(evaluate(arg(0), ctx)).toLowerCase();
    }

    case 'upper': {
      if (argNodes.length !== 1) throw new EvaluationError('upper() requires 1 argument');
      return toStr(evaluate(arg(0), ctx)).toUpperCase();
    }

    case 'trim': {
      if (argNodes.length !== 1) throw new EvaluationError('trim() requires 1 argument');
      return toStr(evaluate(arg(0), ctx)).trim();
    }

    default:
      throw new EvaluationError(`Unknown function: ${name}`);
  }
}

function toBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (val === null || val === undefined || val === '' || val === 0) return false;
  return true;
}

function toNum(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }
  if (typeof val === 'boolean') return val ? 1 : 0;
  return 0;
}

function toStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a === 'number' || typeof b === 'number') {
    const na = typeof a === 'number' ? a : parseFloat(String(a));
    const nb = typeof b === 'number' ? b : parseFloat(String(b));
    if (!isNaN(na) && !isNaN(nb)) return na === nb;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase() === b.toLowerCase();
  }
  return String(a) === String(b);
}
