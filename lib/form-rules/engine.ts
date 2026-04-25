// Vendored from /Users/rrome/Documents/GAB Core/packages/rules-engine/src/engine.ts.
// Keep in sync with upstream.

import type { ASTNode, ExpressionContext, FormRule, RuleEvaluationResult } from './types';
import { tokenize } from './tokenizer';
import { parse } from './parser';
import { evaluate } from './evaluator';

/**
 * Parse and evaluate an expression string in one call.
 * Returns the raw result (boolean, number, string, null).
 */
export function evaluateExpression(expr: string, context: ExpressionContext): unknown {
  const tokens = tokenize(expr);
  const ast = parse(tokens);
  return evaluate(ast, context);
}

/**
 * Parse an expression and return the AST (for caching).
 */
export function compileExpression(expr: string): ASTNode {
  return parse(tokenize(expr));
}

/**
 * Evaluate a pre-compiled AST against a context.
 */
export function evaluateAST(ast: ASTNode, context: ExpressionContext): unknown {
  return evaluate(ast, context);
}

/**
 * Evaluate a full set of form rules against the current field values.
 * Returns maps of visibility, required, readOnly, calculated values, and validation errors.
 */
export function evaluateFormRules(
  rules: FormRule[],
  context: ExpressionContext,
): RuleEvaluationResult {
  const visibility = new Map<string, boolean>();
  const required = new Map<string, boolean>();
  const readOnly = new Map<string, boolean>();
  const values = new Map<string, unknown>();
  const errors = new Map<string, string>();

  for (const rule of rules) {
    try {
      const result = evaluateExpression(rule.expression, context);
      const boolResult = toBool(result);

      switch (rule.type) {
        case 'visibility':
          visibility.set(rule.targetItemId, boolResult);
          break;

        case 'required':
          required.set(rule.targetItemId, boolResult);
          break;

        case 'readOnly':
          readOnly.set(rule.targetItemId, boolResult);
          break;

        case 'setValue':
          if (boolResult && rule.valueExpression) {
            values.set(rule.targetItemId, evaluateExpression(rule.valueExpression, context));
          }
          break;

        case 'validation':
          if (!boolResult && rule.errorMessage) {
            errors.set(rule.targetItemId, rule.errorMessage);
          }
          break;
      }
    } catch {
      // Rule evaluation failed — skip silently to avoid breaking the form.
      // In production, this could log to a telemetry service.
    }
  }

  return { visibility, required, readOnly, values, errors };
}

/**
 * Extract all field names referenced in an expression (for dependency tracking).
 */
export function extractFieldReferences(expr: string): string[] {
  const tokens = tokenize(expr);
  return tokens.filter((t) => t.type === 'field_ref').map((t) => t.value);
}

function toBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (val === null || val === undefined || val === '' || val === 0) return false;
  return true;
}
