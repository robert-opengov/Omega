/**
 * Lightweight static checks for custom component source (no full TS compiler in browser).
 */
export interface AnalyzeResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function analyzeCustomComponentCode(code: string): AnalyzeResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!code.trim()) {
    errors.push('Code is empty.');
    return { ok: false, errors, warnings };
  }

  if (!/export\s+default\s+function|export\s+default\s+\(/m.test(code)) {
    errors.push('Expected `export default function` or `export default (` component.');
  }

  if (/eval\s*\(|new\s+Function\s*\(/m.test(code)) {
    errors.push('eval and new Function are not allowed.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
