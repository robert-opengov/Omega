import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_COOKIE_NAMES } from '@/lib/constants';

const cookieValues = new Map<string, string>();
const setCalls: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
const cookieStore = {
  get: vi.fn((name: string) => {
    const value = cookieValues.get(name);
    return value ? { value } : undefined;
  }),
  set: vi.fn((name: string, value: string, options?: Record<string, unknown>) => {
    cookieValues.set(name, value);
    setCalls.push({ name, value, options });
  }),
  delete: vi.fn((name: string) => {
    cookieValues.delete(name);
  }),
};

const authPortMock = {
  getToken: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  getProfile: vi.fn(),
  checkUserExists: vi.fn(),
};

const gabUserRepoMock = {
  updateUser: vi.fn(),
};

const gabConfigMock = {
  clientId: 'client_1',
};

const authConfigMock = {
  loginMode: 'both',
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock('@/lib/core', () => ({
  authPort: authPortMock,
  gabUserRepo: gabUserRepoMock,
}));

vi.mock('@/config/gab.config', () => ({
  gabConfig: gabConfigMock,
}));

vi.mock('@/config/auth.config', () => ({
  authConfig: authConfigMock,
}));

function createJwt(exp: number) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${header}.${payload}.signature`;
}

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    cookieValues.clear();
    setCalls.length = 0;
    authConfigMock.loginMode = 'both';
    gabConfigMock.clientId = 'client_1';
  });

  it('registerAction returns the created user and does not set auth cookies', async () => {
    authPortMock.register.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'participant',
    });

    const { registerAction } = await import('../auth');
    const result = await registerAction({
      email: 'ada@example.com',
      password: 'Secret123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(authPortMock.register).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'Secret123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(result).toEqual({
      success: true,
      user: {
        id: 'user_1',
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: 'participant',
      },
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('registerAction returns the backend error when registration fails', async () => {
    authPortMock.register.mockRejectedValue(new Error('Email already exists'));

    const { registerAction } = await import('../auth');
    const result = await registerAction({
      email: 'ada@example.com',
      password: 'Secret123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(result).toEqual({
      success: false,
      error: 'Email already exists',
    });
  });

  it('loginAction blocks password login when the app is in sso-only mode', async () => {
    authConfigMock.loginMode = 'sso';

    const { loginAction } = await import('../auth');
    const result = await loginAction('ada@example.com', 'Secret123!');

    expect(result).toEqual({
      success: false,
      error: 'Password login is disabled for this application.',
    });
    expect(authPortMock.login).not.toHaveBeenCalled();
  });

  it('loginAction sets auth cookies and hydrates the session user from profile', async () => {
    authPortMock.login.mockResolvedValue({
      accessToken: createJwt(Math.floor(Date.now() / 1000) + 3600),
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      userName: 'ada@example.com',
      fullName: 'Ada Token',
    });
    authPortMock.getProfile.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'admin',
      isAdmin: true,
    });

    const { loginAction } = await import('../auth');
    const result = await loginAction('ada@example.com', 'Secret123!');

    expect(authPortMock.login).toHaveBeenCalledWith({
      username: 'ada@example.com',
      password: 'Secret123!',
    });
    expect(authPortMock.getProfile).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      user: {
        userId: 'user_1',
        email: 'ada@example.com',
        userName: 'ada@example.com',
        fullName: 'Ada Lovelace',
        clientId: undefined,
        role: 'admin',
      },
    });
    expect(cookieValues.get(AUTH_COOKIE_NAMES.accessToken)).toBeDefined();
    expect(cookieValues.get(AUTH_COOKIE_NAMES.refreshToken)).toBe('refresh-token');
    expect(JSON.parse(cookieValues.get(AUTH_COOKIE_NAMES.userInfo) as string)).toEqual({
      userId: 'user_1',
      email: 'ada@example.com',
      userName: 'ada@example.com',
      fullName: 'Ada Lovelace',
      role: 'admin',
    });
  });

  it('loginAction falls back to token-level identity when profile hydration fails', async () => {
    authPortMock.login.mockResolvedValue({
      accessToken: createJwt(Math.floor(Date.now() / 1000) + 3600),
      refreshToken: undefined,
      expiresIn: 3600,
      userName: 'ada@example.com',
      fullName: 'Ada Token',
      clientId: 'client_1',
    });
    authPortMock.getProfile.mockRejectedValue(new Error('Profile failed'));

    const { loginAction } = await import('../auth');
    const result = await loginAction('ada@example.com', 'Secret123!');

    expect(result).toEqual({
      success: true,
      user: {
        userId: '',
        email: '',
        userName: 'ada@example.com',
        fullName: 'Ada Token',
        clientId: 'client_1',
        role: 'participant',
      },
    });
  });

  it('loginAction returns the adapter error when login fails', async () => {
    authPortMock.login.mockRejectedValue(new Error('Bad credentials'));

    const { loginAction } = await import('../auth');
    const result = await loginAction('ada@example.com', 'Secret123!');

    expect(result).toEqual({
      success: false,
      error: 'Bad credentials',
    });
  });

  it('updateProfileAction rewrites user_info for the current session user', async () => {
    cookieValues.set(
      AUTH_COOKIE_NAMES.accessToken,
      createJwt(Math.floor(Date.now() / 1000) + 3600),
    );
    cookieValues.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify({
      userId: 'user_1',
      email: 'ada@example.com',
      userName: 'ada@example.com',
      fullName: 'Ada Old',
      clientId: 'client_1',
      role: 'participant',
    }));

    gabUserRepoMock.updateUser.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      active: true,
      isExternalUser: false,
      twoFactorEnabled: false,
      tenantId: 'tenant_1',
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    });

    const { updateProfileAction } = await import('../auth');
    const result = await updateProfileAction({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(gabUserRepoMock.updateUser).toHaveBeenCalledWith('user_1', {
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(result.success).toBe(true);

    const updated = JSON.parse(cookieValues.get(AUTH_COOKIE_NAMES.userInfo) as string);
    expect(updated).toEqual({
      userId: 'user_1',
      email: 'ada@example.com',
      userName: 'ada@example.com',
      fullName: 'Ada Lovelace',
      clientId: 'client_1',
      role: 'participant',
    });
    expect(setCalls.find((call) => call.name === AUTH_COOKIE_NAMES.userInfo)?.options).toEqual(
      expect.objectContaining({
        maxAge: expect.any(Number),
        path: '/',
      }),
    );
  });

  it('updateProfileAction returns an error when no session user exists', async () => {
    const { updateProfileAction } = await import('../auth');
    const result = await updateProfileAction({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(result).toEqual({
      success: false,
      error: 'No user session found.',
    });
    expect(gabUserRepoMock.updateUser).not.toHaveBeenCalled();
  });

  it('updateProfileAction returns the repo error when the update fails', async () => {
    cookieValues.set(
      AUTH_COOKIE_NAMES.accessToken,
      createJwt(Math.floor(Date.now() / 1000) + 3600),
    );
    cookieValues.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify({
      userId: 'user_1',
      email: 'ada@example.com',
      userName: 'ada@example.com',
      fullName: 'Ada Old',
      clientId: 'client_1',
      role: 'participant',
    }));
    gabUserRepoMock.updateUser.mockRejectedValue(new Error('Update failed'));

    const { updateProfileAction } = await import('../auth');
    const result = await updateProfileAction({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(result).toEqual({
      success: false,
      error: 'Update failed',
    });
  });

  it('setTwoFactorEnabledAction leaves user_info unchanged', async () => {
    cookieValues.set(AUTH_COOKIE_NAMES.accessToken, 'access-token');
    cookieValues.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify({
      userId: 'user_1',
      email: 'ada@example.com',
      userName: 'ada@example.com',
      fullName: 'Ada Lovelace',
      clientId: 'client_1',
      role: 'participant',
    }));

    gabUserRepoMock.updateUser.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      active: true,
      isExternalUser: false,
      twoFactorEnabled: true,
      tenantId: 'tenant_1',
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    });

    const before = cookieValues.get(AUTH_COOKIE_NAMES.userInfo);
    const { setTwoFactorEnabledAction } = await import('../auth');
    const result = await setTwoFactorEnabledAction(true);

    expect(gabUserRepoMock.updateUser).toHaveBeenCalledWith('user_1', {
      twoFactorEnabled: true,
    });
    expect(result.success).toBe(true);
    expect(cookieValues.get(AUTH_COOKIE_NAMES.userInfo)).toBe(before);
  });

  it('setTwoFactorEnabledAction returns an error when no session user exists', async () => {
    const { setTwoFactorEnabledAction } = await import('../auth');
    const result = await setTwoFactorEnabledAction(true);

    expect(result).toEqual({
      success: false,
      error: 'No user session found.',
    });
    expect(gabUserRepoMock.updateUser).not.toHaveBeenCalled();
  });

  it('setTwoFactorEnabledAction returns the repo error when the update fails', async () => {
    cookieValues.set(AUTH_COOKIE_NAMES.accessToken, 'access-token');
    cookieValues.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify({
      userId: 'user_1',
      email: 'ada@example.com',
      userName: 'ada@example.com',
      fullName: 'Ada Lovelace',
      clientId: 'client_1',
      role: 'participant',
    }));
    gabUserRepoMock.updateUser.mockRejectedValue(new Error('2FA failed'));

    const { setTwoFactorEnabledAction } = await import('../auth');
    const result = await setTwoFactorEnabledAction(true);

    expect(result).toEqual({
      success: false,
      error: '2FA failed',
    });
  });

  it('ssoCallbackAction blocks SSO login when the app is in password-only mode', async () => {
    authConfigMock.loginMode = 'password';

    const { ssoCallbackAction } = await import('../auth');
    const result = await ssoCallbackAction('access-token', 3600);

    expect(result).toEqual({
      success: false,
      error: 'SSO login is disabled for this application.',
    });
  });

  it('ssoCallbackAction sets authProvider and hydrates the session from profile', async () => {
    authPortMock.getProfile.mockResolvedValue({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'superadmin',
      isAdmin: true,
    });

    const { ssoCallbackAction } = await import('../auth');
    const result = await ssoCallbackAction('access-token', 3600);

    expect(authPortMock.getProfile).toHaveBeenCalledWith('access-token');
    expect(result).toEqual({
      success: true,
      user: {
        userId: 'user_1',
        email: 'ada@example.com',
        userName: 'ada@example.com',
        fullName: 'Ada Lovelace',
        clientId: 'client_1',
        role: 'superadmin',
      },
    });
    expect(cookieValues.get(AUTH_COOKIE_NAMES.authProvider)).toBe('sso');
  });

  it('checkUserExistsAction returns false on unauthorized and true on non-fatal errors', async () => {
    authPortMock.checkUserExists.mockRejectedValueOnce(new Error('Unauthorized'));
    authPortMock.checkUserExists.mockRejectedValueOnce(new Error('Transient failure'));

    const { checkUserExistsAction } = await import('../auth');

    await expect(checkUserExistsAction('token', 'ada@example.com')).resolves.toBe(false);
    await expect(checkUserExistsAction('token', 'ada@example.com')).resolves.toBe(true);
  });
});
