import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/features', () => ({
  isModuleEnabled: vi.fn(),
}));

import { isFeatureEnabled, type NavItem } from '../navigation.config';
import type { AppFeatures } from '../app.config';
import { isModuleEnabled } from '@/lib/features';

const features: AppFeatures = {
  enableDarkMode: true,
  enableI18n: false,
  enableNotifications: true,
  enableSignup: false,
  enableSiteBanner: false,
  enableNavbarLogout: true,
};

const mockedIsModuleEnabled = isModuleEnabled as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedIsModuleEnabled.mockReset();
});

const baseItem: NavItem = {
  href: '/x',
  label: 'X',
  icon: () => null as never,
};

describe('isFeatureEnabled (navigation)', () => {
  it('returns true when no flag is set', () => {
    expect(isFeatureEnabled(baseItem, features)).toBe(true);
    expect(mockedIsModuleEnabled).not.toHaveBeenCalled();
  });

  it('reads cosmetic AppFeatures keys directly', () => {
    expect(isFeatureEnabled({ ...baseItem, featureFlag: 'enableSignup' }, features)).toBe(false);
    expect(isFeatureEnabled({ ...baseItem, featureFlag: 'enableDarkMode' }, features)).toBe(true);
    expect(mockedIsModuleEnabled).not.toHaveBeenCalled();
  });

  it('falls through to dotted module paths via the static helper when no modules tree is supplied', () => {
    mockedIsModuleEnabled.mockReturnValue(true);
    expect(isFeatureEnabled({ ...baseItem, featureFlag: 'platform.tenants' }, features)).toBe(true);
    expect(mockedIsModuleEnabled).toHaveBeenCalledWith('platform.tenants');

    mockedIsModuleEnabled.mockReturnValue(false);
    expect(isFeatureEnabled({ ...baseItem, featureFlag: 'platform.aiBuilder' }, features)).toBe(false);
  });

  it('uses the supplied modules tree (cookie-aware) instead of the static helper when provided', () => {
    const modules = {
      platform: { tenants: false, users: true, templates: true, aiBuilder: true, uiShowcase: true },
      app: {
        overview: true, tables: true, relationships: true, roles: true, notifications: true,
        jobs: true, audit: true, forms: true, reports: true, pages: true,
        customComponents: true, workflows: true, sandbox: true, settings: true,
      },
      services: { ocr: true, ai: true },
      pageBuilder: { builtins: true, customComponents: true },
    };
    expect(
      isFeatureEnabled({ ...baseItem, featureFlag: 'platform.tenants' }, features, modules),
    ).toBe(false);
    expect(
      isFeatureEnabled({ ...baseItem, featureFlag: 'platform.users' }, features, modules),
    ).toBe(true);
    expect(mockedIsModuleEnabled).not.toHaveBeenCalled();
  });
});
