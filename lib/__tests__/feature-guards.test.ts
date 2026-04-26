import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { notFoundMock, cookiesMock } = vi.hoisted(() => {
  const cookieStore = new Map<string, { value: string }>();
  return {
    notFoundMock: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND');
    }),
    cookiesMock: {
      store: cookieStore,
      get: vi.fn((name: string) => cookieStore.get(name)),
      set: vi.fn((name: string, value: string) => {
        cookieStore.set(name, { value });
      }),
      delete: vi.fn((name: string) => {
        cookieStore.delete(name);
      }),
    },
  };
});

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookiesMock),
}));

import {
  featureGuard,
  assertModuleEnabled,
  FeatureDisabledError,
} from '../feature-guards';
import { modulesConfig } from '@/config/modules.config';

let snapshot: typeof modulesConfig;

beforeEach(() => {
  notFoundMock.mockClear();
  cookiesMock.store.clear();
  snapshot = JSON.parse(JSON.stringify(modulesConfig));
  modulesConfig.platform.tenants = true;
  modulesConfig.app.workflows = true;
  modulesConfig.services.ocr = true;
  modulesConfig.pageBuilder.builtins = true;
});

afterEach(() => {
  Object.assign(modulesConfig.platform, snapshot.platform);
  Object.assign(modulesConfig.app, snapshot.app);
  Object.assign(modulesConfig.services, snapshot.services);
  Object.assign(modulesConfig.pageBuilder, snapshot.pageBuilder);
});

describe('featureGuard (async, effective)', () => {
  it('is a no-op when the module is on', async () => {
    await featureGuard('app.workflows');
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it('calls notFound() when the baseline module is off', async () => {
    modulesConfig.app.workflows = false;
    await expect(featureGuard('app.workflows')).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it('respects a cookie override that disables an otherwise-on module', async () => {
    cookiesMock.store.set('omega_module_overrides', {
      value: encodeURIComponent(JSON.stringify({ 'app.workflows': false })),
    });
    await expect(featureGuard('app.workflows')).rejects.toThrow(/NEXT_NOT_FOUND/);
  });

  it('respects a cookie override that re-enables a baseline-off module', async () => {
    modulesConfig.app.workflows = false;
    cookiesMock.store.set('omega_module_overrides', {
      value: encodeURIComponent(JSON.stringify({ 'app.workflows': true })),
    });
    await featureGuard('app.workflows');
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});

describe('assertModuleEnabled (async)', () => {
  it('throws FeatureDisabledError when the module is off', async () => {
    modulesConfig.services.ocr = false;
    await expect(assertModuleEnabled('services.ocr')).rejects.toThrow(FeatureDisabledError);
  });

  it('does not throw when the module is on', async () => {
    await expect(assertModuleEnabled('services.ocr')).resolves.toBeUndefined();
  });

  it('throws when a cookie override disables it', async () => {
    cookiesMock.store.set('omega_module_overrides', {
      value: encodeURIComponent(JSON.stringify({ 'services.ocr': false })),
    });
    await expect(assertModuleEnabled('services.ocr')).rejects.toThrow(FeatureDisabledError);
  });
});
