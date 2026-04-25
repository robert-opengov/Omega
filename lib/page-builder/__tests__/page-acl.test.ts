import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GabPage } from '@/lib/core/ports/pages.repository';

// Hoisted mocks — vitest requires the factory to live in `vi.mock` and not
// reference outer-scope variables, so we wire helpers via a separate module.
vi.mock('@/lib/core', () => {
  return {
    authPort: {
      getToken: vi.fn(),
      getProfile: vi.fn(),
    },
    gabAppRoleRepo: {
      listUserRoles: vi.fn(),
    },
  };
});

import { authPort, gabAppRoleRepo } from '@/lib/core';
import { checkPageAccess } from '../page-acl';

const mockedAuth = authPort as unknown as {
  getToken: ReturnType<typeof vi.fn>;
  getProfile: ReturnType<typeof vi.fn>;
};
const mockedRoles = gabAppRoleRepo as unknown as {
  listUserRoles: ReturnType<typeof vi.fn>;
};

function makePage(overrides: Partial<GabPage> = {}): GabPage {
  return {
    id: '1',
    key: 'k',
    name: 'n',
    slug: 's',
    icon: null,
    layout: { type: 'grid', rows: [] },
    config: {},
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('checkPageAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows when no allow-list is configured', async () => {
    const result = await checkPageAccess('app1', makePage());
    expect(result.allowed).toBe(true);
    expect(mockedAuth.getToken).not.toHaveBeenCalled();
  });

  it('allows public pages even when an allow-list is set', async () => {
    const page = makePage({ config: { isPublic: true, rolesAllowed: ['admin'] } });
    const result = await checkPageAccess('app1', page);
    expect(result.allowed).toBe(true);
  });

  it('denies when no token is available and a role list is set', async () => {
    mockedAuth.getToken.mockResolvedValue(null);
    const page = makePage({ config: { rolesAllowed: ['editor'] } });
    const result = await checkPageAccess('app1', page);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('unauthenticated');
  });

  it('allows admins regardless of role match', async () => {
    mockedAuth.getToken.mockResolvedValue('tok');
    mockedAuth.getProfile.mockResolvedValue({ id: 'u1', isAdmin: true });
    const page = makePage({ config: { rolesAllowed: ['editor'] } });
    const result = await checkPageAccess('app1', page);
    expect(result.allowed).toBe(true);
  });

  it('allows when the user has a matching role slug', async () => {
    mockedAuth.getToken.mockResolvedValue('tok');
    mockedAuth.getProfile.mockResolvedValue({ id: 'u1', isAdmin: false });
    mockedRoles.listUserRoles.mockResolvedValue({
      items: [{ roleSlug: 'editor' }, { slug: 'viewer' }],
    });
    const page = makePage({ config: { rolesAllowed: ['editor'] } });
    const result = await checkPageAccess('app1', page);
    expect(result.allowed).toBe(true);
  });

  it('denies when the user has no matching roles', async () => {
    mockedAuth.getToken.mockResolvedValue('tok');
    mockedAuth.getProfile.mockResolvedValue({ id: 'u1', isAdmin: false });
    mockedRoles.listUserRoles.mockResolvedValue({
      items: [{ roleSlug: 'viewer' }],
    });
    const page = makePage({ config: { rolesAllowed: ['editor'] } });
    const result = await checkPageAccess('app1', page);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('forbidden');
  });

  it('denies when the role lookup throws', async () => {
    mockedAuth.getToken.mockResolvedValue('tok');
    mockedAuth.getProfile.mockResolvedValue({ id: 'u1', isAdmin: false });
    mockedRoles.listUserRoles.mockRejectedValue(new Error('boom'));
    const page = makePage({ config: { rolesAllowed: ['editor'] } });
    const result = await checkPageAccess('app1', page);
    expect(result.allowed).toBe(false);
  });
});
