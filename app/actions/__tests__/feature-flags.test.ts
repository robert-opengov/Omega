import { describe, it, expect, vi, beforeEach } from 'vitest';

const { cookiesMock, revalidatePathMock } = vi.hoisted(() => {
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
    revalidatePathMock: vi.fn(),
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookiesMock),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  getModuleFlagSnapshot,
  setModuleOverrideAction,
  clearModuleOverrideAction,
  clearAllModuleOverridesAction,
} from '../feature-flags';
import { modulesConfig } from '@/config/modules.config';

beforeEach(() => {
  cookiesMock.store.clear();
  revalidatePathMock.mockClear();
});

describe('getModuleFlagSnapshot', () => {
  it('returns baseline + overrides + effective', async () => {
    const snapshot = await getModuleFlagSnapshot();
    expect(snapshot.baseline).toBe(modulesConfig);
    expect(snapshot.overrides).toEqual({});
    expect(snapshot.effective.app.workflows).toBe(modulesConfig.app.workflows);
  });
});

describe('setModuleOverrideAction', () => {
  it('rejects unknown paths without writing the cookie', async () => {
    const result = await setModuleOverrideAction('not.a.real.path', false);
    expect(result).toEqual({ ok: false, error: expect.stringContaining('not.a.real.path') });
    expect(cookiesMock.set).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('writes the override and revalidates the layout', async () => {
    const result = await setModuleOverrideAction('app.workflows', false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.overrides).toEqual({ 'app.workflows': false });
    expect(result.snapshot.effective.app.workflows).toBe(false);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('clearModuleOverrideAction', () => {
  it('removes a single override and revalidates', async () => {
    await setModuleOverrideAction('app.workflows', false);
    await setModuleOverrideAction('platform.tenants', false);
    revalidatePathMock.mockClear();

    const result = await clearModuleOverrideAction('app.workflows');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.overrides).toEqual({ 'platform.tenants': false });
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
  });

  it('rejects unknown paths', async () => {
    const result = await clearModuleOverrideAction('garbage');
    expect(result).toEqual({ ok: false, error: expect.stringContaining('garbage') });
  });
});

describe('clearAllModuleOverridesAction', () => {
  it('clears every override and revalidates', async () => {
    await setModuleOverrideAction('app.workflows', false);
    await setModuleOverrideAction('platform.tenants', false);
    revalidatePathMock.mockClear();

    const result = await clearAllModuleOverridesAction();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.overrides).toEqual({});
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
  });
});
