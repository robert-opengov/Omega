/**
 * Static analyzer for custom-component source code.
 *
 * Uses `acorn` to parse user code into an AST, then `acorn-walk` to walk it
 * and surface any access patterns we don't want running inside the iframe
 * sandbox. The set is conservative — it blocks things that could either
 * exfiltrate data, break the SDK contract, or cause runtime crashes that
 * are hard to diagnose from inside the sandbox.
 *
 * The iframe is already `sandbox="allow-scripts"` so it cannot reach the
 * parent's DOM or cookies. This static check is a second layer that catches
 * mistakes early (in the editor) and gives users specific feedback.
 */

import { parse, type Node, type Options } from 'acorn';
import { simple as walkSimple } from 'acorn-walk';

const PARSE_OPTIONS: Options = {
  ecmaVersion: 2022,
  sourceType: 'module',
  allowReturnOutsideFunction: false,
  allowAwaitOutsideFunction: true,
};

const MAX_CODE_BYTES = 50_000;

/** Identifiers that must not be referenced anywhere in user code. */
const BANNED_IDENTIFIERS = new Set<string>([
  'eval',
  'Function',
  'document',
  'localStorage',
  'sessionStorage',
  'XMLHttpRequest',
  'fetch',
  'importScripts',
]);

/** Member-access patterns blocked regardless of base object. */
const BANNED_MEMBER_PROPERTIES = new Set<string>([
  'innerHTML',
  'outerHTML',
  'cookie',
  'eval',
]);

/** Member-access patterns blocked on `window` / globalThis specifically. */
const BANNED_WINDOW_MEMBERS = new Set<string>([
  'parent',
  'top',
  'opener',
  'open',
  'postMessage',
  'document',
  'localStorage',
  'sessionStorage',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
]);

export interface AnalyzeResult {
  ok: boolean;
  errors: AnalyzeIssue[];
  warnings: AnalyzeIssue[];
}

export interface AnalyzeIssue {
  message: string;
  line?: number;
  column?: number;
}

/**
 * Visitors run against the acorn AST. We narrow specific shapes inside each
 * visitor rather than maintaining a parallel type tree.
 */
type AnyNode = {
  type: string;
  start: number;
  end: number;
  name?: string;
  property?: { type?: string; name?: string };
  object?: { type?: string; name?: string };
  computed?: boolean;
  loc?: { start: { line: number; column: number } } | null;
  callee?: { type?: string; name?: string };
};

function locOf(node: AnyNode): { line?: number; column?: number } {
  return {
    line: node.loc?.start?.line,
    column: node.loc?.start?.column,
  };
}

export function analyzeCustomComponentCode(code: string): AnalyzeResult {
  const errors: AnalyzeIssue[] = [];
  const warnings: AnalyzeIssue[] = [];

  if (!code.trim()) {
    return { ok: false, errors: [{ message: 'Code is empty.' }], warnings };
  }

  if (code.length > MAX_CODE_BYTES) {
    errors.push({
      message: `Code exceeds ${MAX_CODE_BYTES.toLocaleString()} byte limit (got ${code.length.toLocaleString()}).`,
    });
    return { ok: false, errors, warnings };
  }

  let ast;
  try {
    ast = parse(code, { ...PARSE_OPTIONS, locations: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse error.';
    return { ok: false, errors: [{ message: `Syntax error: ${message}` }], warnings };
  }

  let hasDefaultExport = false;
  let importsAllowed = true;

  // acorn-walk's `simple` accepts `any`-typed visitors at runtime — we cast the
  // visitor map to `any` so we can keep our narrowed `AnyNode` parameter types
  // without depending on acorn's full discriminated union.
  walkSimple(
    ast as unknown as Node,
    /* eslint-disable @typescript-eslint/no-explicit-any */
    {
      ExportDefaultDeclaration() {
        hasDefaultExport = true;
      },

      Identifier(node: AnyNode) {
        if (node.name && BANNED_IDENTIFIERS.has(node.name)) {
          errors.push({
            message: `Use of identifier "${node.name}" is not allowed in custom components.`,
            ...locOf(node),
          });
        }
      },

      MemberExpression(node: AnyNode) {
        const propName = !node.computed && node.property?.name;
        if (propName && BANNED_MEMBER_PROPERTIES.has(propName)) {
          errors.push({
            message: `Member access "${propName}" is not allowed (XSS / data exfiltration risk).`,
            ...locOf(node),
          });
          return;
        }
        const objName = node.object?.name;
        if (
          propName &&
          (objName === 'window' || objName === 'globalThis' || objName === 'self') &&
          BANNED_WINDOW_MEMBERS.has(propName)
        ) {
          errors.push({
            message: `${objName}.${propName} is not allowed inside the sandbox.`,
            ...locOf(node),
          });
        }
      },

      CallExpression(node: AnyNode) {
        const callee = node.callee;
        if (callee?.type === 'Identifier' && callee.name) {
          if (callee.name === 'eval' || callee.name === 'Function') {
            errors.push({
              message: `${callee.name}() is not allowed.`,
              ...locOf(node),
            });
          }
        }
      },

      NewExpression(node: AnyNode) {
        const callee = node.callee;
        if (callee?.type === 'Identifier' && callee.name === 'Function') {
          errors.push({
            message: 'new Function() is not allowed.',
            ...locOf(node),
          });
        }
      },

      ImportDeclaration(node: AnyNode) {
        if (!importsAllowed) return;
        warnings.push({
          message:
            'import statements are stripped at runtime — use `window.gab` and `window.OMEGA_UI` directly.',
          ...locOf(node),
        });
      },
    } as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */
  );

  if (!hasDefaultExport) {
    // Permit CJS-style `module.exports = ...` because the runtime supports it.
    if (!/module\.exports\s*=/.test(code) && !/exports\.default\s*=/.test(code)) {
      errors.push({
        message: 'Expected a default export — `export default function Foo(){...}`.',
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
