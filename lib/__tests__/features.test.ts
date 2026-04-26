import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isModuleEnabled } from '../features';
import { modulesConfig } from '@/config/modules.config';

let snapshot: typeof modulesConfig;

beforeEach(() => {
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

describe('isModuleEnabled (sync, baseline-only)', () => {
  it('returns true for known paths that are on', () => {
    expect(isModuleEnabled('app.workflows')).toBe(true);
    expect(isModuleEnabled('platform.tenants')).toBe(true);
    expect(isModuleEnabled('services.ocr')).toBe(true);
    expect(isModuleEnabled('pageBuilder.builtins')).toBe(true);
  });

  it('returns false when a leaf is flipped off', () => {
    modulesConfig.app.workflows = false;
    expect(isModuleEnabled('app.workflows')).toBe(false);
  });

  it('returns false for an unknown path', () => {
    expect(isModuleEnabled('nope.nope')).toBe(false);
    expect(isModuleEnabled('app.nope')).toBe(false);
  });
});
