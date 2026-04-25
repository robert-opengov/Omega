import { describe, it, expect } from 'vitest';
import { analyzeCustomComponentCode } from '../custom-component-analyze';

describe('analyzeCustomComponentCode', () => {
  it('rejects empty code', () => {
    const r = analyzeCustomComponentCode('   ');
    expect(r.ok).toBe(false);
    expect(r.errors[0]!.message).toMatch(/empty/i);
  });

  it('flags syntax errors with a parse message', () => {
    const r = analyzeCustomComponentCode('export default function ( {');
    expect(r.ok).toBe(false);
    expect(r.errors[0]!.message).toMatch(/syntax/i);
  });

  it('accepts a minimal valid component', () => {
    const code = `export default function Hello(){
      return null;
    }`;
    const r = analyzeCustomComponentCode(code);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('blocks eval and Function usage', () => {
    const r = analyzeCustomComponentCode(`
      export default function X(){
        eval('1+1');
        new Function('return 1');
        return null;
      }
    `);
    expect(r.ok).toBe(false);
    const messages = r.errors.map((e) => e.message).join('\n');
    expect(messages).toMatch(/eval/);
    expect(messages).toMatch(/new Function/i);
  });

  it('blocks document/cookie access', () => {
    const r = analyzeCustomComponentCode(`
      export default function X(){
        const c = document.cookie;
        return c;
      }
    `);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /document/.test(e.message))).toBe(true);
    expect(r.errors.some((e) => /cookie/.test(e.message))).toBe(true);
  });

  it('blocks window.parent / window.postMessage', () => {
    const r = analyzeCustomComponentCode(`
      export default function X(){
        window.parent.postMessage({}, '*');
        return null;
      }
    `);
    expect(r.ok).toBe(false);
    const msg = r.errors.map((e) => e.message).join('\n');
    expect(msg).toMatch(/window\.parent/);
  });

  it('blocks innerHTML writes', () => {
    const r = analyzeCustomComponentCode(`
      export default function X(){
        const el = {};
        el.innerHTML = '<img onerror=alert(1) src=x>';
        return null;
      }
    `);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /innerHTML/.test(e.message))).toBe(true);
  });

  it('warns on import statements', () => {
    const r = analyzeCustomComponentCode(`
      import React from 'react';
      export default function X(){ return null; }
    `);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]!.message).toMatch(/import/i);
  });

  it('errors when no default export is present', () => {
    const r = analyzeCustomComponentCode(`
      function X(){ return null; }
    `);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /default export/i.test(e.message))).toBe(true);
  });

  it('allows module.exports as a CJS default export', () => {
    const r = analyzeCustomComponentCode(`
      function X(){ return null; }
      module.exports = X;
    `);
    expect(r.ok).toBe(true);
  });

  it('reports line/column for blocked patterns', () => {
    const code = `export default function X(){
  return eval('1');
}
`;
    const r = analyzeCustomComponentCode(code);
    expect(r.ok).toBe(false);
    const issue = r.errors.find((e) => /eval/.test(e.message));
    expect(issue?.line).toBe(2);
    expect(typeof issue?.column).toBe('number');
  });
});
