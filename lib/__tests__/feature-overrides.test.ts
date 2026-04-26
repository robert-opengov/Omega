import { describe, it, expect, vi, beforeEach } from 'vitest';

const { cookiesMock } = vi.hoisted(() => {
  const store = new Map<string, { value: string }>();
  return {
    cookiesMock: {
      store,
      get: vi.fn((name: string) => store.get(name)),
      set: vi.fn((name: string, value: string) => {
        store.set(name, { value });
      }),
      delete: vi.fn((name: string) => {
        store.delete(name);
      }),
    },
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookiesMock),
}));

import {
  OVERRIDES_COOKIE,
  parseOverrides,
  serializeOverrides,
  isValidModulePath,
  readOverrides,
  writeOverrides,
  setOverride,
  clearOverride,
  clearAllOverrides,
  getEffectiveModules,
} from '../feature-overrides';
import { modulesConfig } from '@/config/modules.config';

beforeEach(() => {
  cookiesMock.store.clear();
});

describe('parseOverrides', () => {
  it('returns {} for empty / missing input', () => {
    expect(parseOverrides(undefined)).toEqual({});
    expect(parseOverrides(null)).toEqual({});
    expect(parseOverrides('')).toEqual({});
  });

  it('parses URL-encoded JSON and keeps only valid module paths with boolean values', () => {
    const raw = encodeURIComponent(
      JSON.stringify({
        'app.workflows': false,
        'platform.tenants': true,
        'app.unknown': true,         // unknown leaf — drop
        'invalid.path': false,       // unknown category — drop
        'app.workflows-bad-type': 'no', // wrong type — drop
      }),
    );
    expect(parseOverrides(raw)).toEqual({
      'app.workflows': false,
      'platform.tenants': true,
    });
  });

  it('returns {} on malformed JSON', () => {
    expect(parseOverrides('%7Bnot-json')).toEqual({});
  });
});

describe('serializeOverrides', () => {
  it('round-trips through parseOverrides', () => {
    const input = { 'app.forms': false, 'platform.aiBuilder': true } as const;
    expect(parseOverrides(serializeOverrides(input))).toEqual(input);
  });
});

describe('isValidModulePath', () => {
  it('accepts every leaf in modulesConfig', () => {
    for (const cat of Object.keys(modulesConfig) as Array<keyof typeof modulesConfig>) {
      for (const leaf of Object.keys(modulesConfig[cat])) {
        expect(isValidModulePath(`${cat}.${leaf}`)).toBe(true);
      }
    }
  });

  it('rejects unknown paths', () => {
    expect(isValidModulePath('app.does-not-exist')).toBe(false);
    expect(isValidModulePath('zzz.something')).toBe(false);
    expect(isValidModulePath('')).toBe(false);
    expect(isValidModulePath('app')).toBe(false);
  });
});

describe('cookie I/O', () => {
  it('readOverrides returns {} when cookie is absent', async () => {
    expect(await readOverrides()).toEqual({});
  });

  it('writeOverrides + readOverrides round-trip', async () => {
    await writeOverrides({ 'app.workflows': false });
    expect(await readOverrides()).toEqual({ 'app.workflows': false });
  });

  it('writeOverrides({}) deletes the cookie', async () => {
    await writeOverrides({ 'app.workflows': false });
    expect(cookiesMock.store.has(OVERRIDES_COOKIE)).toBe(true);
    await writeOverrides({});
    expect(cookiesMock.store.has(OVERRIDES_COOKIE)).toBe(false);
  });

  it('setOverride / clearOverride mutate one entry', async () => {
    await setOverride('app.workflows', false);
    await setOverride('platform.tenants', false);
    expect(await readOverrides()).toEqual({
      'app.workflows': false,
      'platform.tenants': false,
    });
    await clearOverride('app.workflows');
    expect(await readOverrides()).toEqual({ 'platform.tenants': false });
  });

  it('clearAllOverrides removes the cookie entirely', async () => {
    await setOverride('app.workflows', false);
    await clearAllOverrides();
    expect(cookiesMock.store.has(OVERRIDES_COOKIE)).toBe(false);
    expect(await readOverrides()).toEqual({});
  });
});

describe('getEffectiveModules', () => {
  it('returns the baseline when no cookie is set', async () => {
    const effective = await getEffectiveModules();
    expect(effective.app.workflows).toBe(modulesConfig.app.workflows);
    expect(effective.platform.tenants).toBe(modulesConfig.platform.tenants);
  });

  it('applies cookie overrides on top of the baseline', async () => {
    await writeOverrides({ 'app.workflows': false, 'services.ocr': false });
    const effective = await getEffectiveModules();
    expect(effective.app.workflows).toBe(false);
    expect(effective.services.ocr).toBe(false);
    // unrelated leaves stay at baseline
    expect(effective.platform.tenants).toBe(modulesConfig.platform.tenants);
  });

  it('does not mutate the baseline modulesConfig', async () => {
    const baselineSnapshot = JSON.parse(JSON.stringify(modulesConfig));
    await writeOverrides({ 'app.workflows': !modulesConfig.app.workflows });
    await getEffectiveModules();
    expect(modulesConfig).toEqual(baselineSnapshot);
  });
});
