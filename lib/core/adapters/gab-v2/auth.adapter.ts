import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '@/lib/constants';
import type {
  IAuthPort,
  LoginParams,
  LoginResult,
  RegisterParams,
  RegisteredUser,
  UserProfile,
} from '../../ports/auth.port';

function normalizeRole(input: unknown): UserProfile['role'] {
  if (input === 'super_admin') return 'superadmin';
  if (input === 'admin') return 'admin';
  return 'participant';
}

function splitName(name: string | undefined) {
  return {
    firstName: name?.split(' ')[0] || '',
    lastName: name?.split(' ').slice(1).join(' ') || '',
  };
}

/**
 * GAB V2 authentication adapter.
 *
 * Implements the IAuthPort interface using the JSON-based /v2/auth/* endpoints.
 * V2 does not use client_id — only email + password.
 */
export class GabAuthV2Adapter implements IAuthPort {
  constructor(private readonly apiUrl: string) {}

  async getToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value || null;
  }

  async login(params: LoginParams): Promise<LoginResult> {
    const { username, password } = params;

    const loginRes = await fetch(`${this.apiUrl}/v2/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: username,
        password,
      }),
      cache: 'no-store',
    });

    if (!loginRes.ok) {
      const err = await loginRes.json().catch(() => null);
      throw new Error(err?.message || err?.error || 'Login failed.');
    }

    const data = await loginRes.json();
    const responseUser = data.user || {};

    const expiresIn = data.exp
      ? Math.max(Math.floor(data.exp - Date.now() / 1000), 60)
      : 3600;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn,
      userName: responseUser.email || username,
      fullName: responseUser.name || username,
    };
  }

  async register(params: RegisterParams): Promise<RegisteredUser> {
    const name = `${params.firstName} ${params.lastName}`.trim();

    const res = await fetch(`${this.apiUrl}/v2/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        name,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || err?.error || 'Registration failed.');
    }

    const data = await res.json();
    const parsedName = splitName(data.name || name);

    return {
      id: String(data.id ?? ''),
      email: data.email || params.email,
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      role: normalizeRole(data.role),
    };
  }

  async checkUserExists(
    _token: string,
    _email: string,
    _applicationKey?: string,
  ): Promise<boolean> {
    // Since gab-core does not currently expose a direct /v2/auth/userExists endpoint,
    // implement a placeholder that returns true (matching the non-fatal fallback behavior in V1).
    return true;
  }

  async getProfile(token: string): Promise<UserProfile> {
    const res = await fetch(`${this.apiUrl}/v2/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch profile (${res.status})`);
    }

    const p = await res.json();
    const role = normalizeRole(p.role);
    const parsedName = splitName(p.name);

    return {
      id: String(p.id ?? ''),
      email: p.email || '',
      // v2 name is formatted via: `${user.firstName} ${user.lastName}`.trim()
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      role,
      isAdmin: role === 'admin' || role === 'superadmin',
    };
  }
}
