import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '@/lib/constants';
import type {
  IAuthPort,
  LoginParams,
  LoginResult,
  UserProfile,
} from '../../ports/auth.port';

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

    const expiresIn = data.exp
      ? Math.max(Math.floor(data.exp - Date.now() / 1000), 60)
      : 3600;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn,
      userName: data.email || username,
      fullName: data.name || username,
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

    let role: UserProfile['role'] = 'participant';
    if (p.role === 'super_admin') {
      role = 'superadmin';
    } else if (p.role === 'admin') {
      role = 'admin';
    }

    return {
      id: String(p.id ?? ''),
      email: p.email || '',
      // v2 name is formatted via: `${user.firstName} ${user.lastName}`.trim()
      firstName: p.name?.split(' ')[0] || '',
      lastName: p.name?.split(' ').slice(1).join(' ') || '',
      role,
      isAdmin: role === 'admin' || role === 'superadmin',
    };
  }
}
