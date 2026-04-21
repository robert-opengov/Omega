import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = {
  get: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import { GabAuthV2Adapter } from '../auth.adapter';

const BASE_URL = 'https://gab.example.com';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GabAuthV2Adapter — register', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cookieStore.get.mockReset();
  });

  it('joins first and last name into the live v2 register payload', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'user_123',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        role: 'participant',
      }),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL) as any;

    const result = await adapter.register({
      email: 'ada@example.com',
      password: 'Secret123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/auth/register`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'ada@example.com',
      password: 'Secret123!',
      name: 'Ada Lovelace',
    });
    expect(result).toEqual({
      id: 'user_123',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'participant',
    });
  });

  it('surfaces the backend error message when register fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Email already exists' }, 400),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL) as any;

    await expect(
      adapter.register({
        email: 'ada@example.com',
        password: 'Secret123!',
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    ).rejects.toThrow('Email already exists');
  });
});

describe('GabAuthV2Adapter — login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cookieStore.get.mockReset();
  });

  it('reads fallback identity fields from the nested live token response user object', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user_123',
          email: 'ada@example.com',
          name: 'Ada Lovelace',
          role: 'participant',
        },
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL);
    const result = await adapter.login({
      username: 'ada@example.com',
      password: 'Secret123!',
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/v2/auth/token`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'ada@example.com',
      password: 'Secret123!',
    });
    expect(result.userName).toBe('ada@example.com');
    expect(result.fullName).toBe('Ada Lovelace');
  });

  it('surfaces the backend error message when login fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Bad credentials' }, 401),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL);

    await expect(
      adapter.login({
        username: 'ada@example.com',
        password: 'Secret123!',
      }),
    ).rejects.toThrow('Bad credentials');
  });

  it('uses a minimum expiresIn of 60 seconds when exp is already in the past', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          email: 'ada@example.com',
          name: 'Ada Lovelace',
        },
        exp: Math.floor(Date.now() / 1000) - 30,
      }),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL);
    const result = await adapter.login({
      username: 'ada@example.com',
      password: 'Secret123!',
    });

    expect(result.expiresIn).toBe(60);
  });

  it('defaults expiresIn to 3600 when the token response omits exp', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          email: 'ada@example.com',
          name: 'Ada Lovelace',
        },
      }),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL);
    const result = await adapter.login({
      username: 'ada@example.com',
      password: 'Secret123!',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      userName: 'ada@example.com',
      fullName: 'Ada Lovelace',
    });
  });
});

describe('GabAuthV2Adapter — profile and token helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cookieStore.get.mockReset();
  });

  it('reads the access token from cookies', async () => {
    cookieStore.get.mockReturnValue({ value: 'access-token' });

    const adapter = new GabAuthV2Adapter(BASE_URL);
    await expect(adapter.getToken()).resolves.toBe('access-token');
    expect(cookieStore.get).toHaveBeenCalledWith('access_token');
  });

  it('normalizes super_admin profile data and splits the name', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'user_1',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        role: 'super_admin',
      }),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL);
    await expect(adapter.getProfile('access-token')).resolves.toEqual({
      id: 'user_1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'superadmin',
      isAdmin: true,
    });
  });

  it('normalizes admin profile data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'user_2',
        email: 'grace@example.com',
        name: 'Grace Hopper',
        role: 'admin',
      }),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL);
    const result = await adapter.getProfile('access-token');
    expect(result.role).toBe('admin');
    expect(result.isAdmin).toBe(true);
  });

  it('throws when the profile request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Unauthorized' }, 401),
    );

    const adapter = new GabAuthV2Adapter(BASE_URL);
    await expect(adapter.getProfile('access-token')).rejects.toThrow(
      'Failed to fetch profile (401)',
    );
  });

  it('returns true from the v2 checkUserExists placeholder', async () => {
    const adapter = new GabAuthV2Adapter(BASE_URL);
    await expect(adapter.checkUserExists('token', 'ada@example.com')).resolves.toBe(true);
  });
});
