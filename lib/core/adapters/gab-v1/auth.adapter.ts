import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '@/lib/constants';
import type {
  IAuthPort,
  LoginParams,
  LoginResult,
  UserProfile,
} from '../../ports/auth.port';

/**
 * GAB V1 authentication adapter.
 *
 * Encapsulates the full V1 auth flow:
 *   Step 1 — POST /api/User/login  (validates credentials, 2FA, reCAPTCHA)
 *   Step 2 — POST /token           (OAuth token exchange)
 *
 * When V2/SSO replaces V1, create a new adapter implementing IAuthPort
 * and swap it in lib/core/index.ts — no Server Action changes needed.
 */
export class NextAuthAdapter implements IAuthPort {
  constructor(
    private readonly apiUrl: string,
    private readonly clientId: string,
  ) {}

  async getToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value || null;
  }

  async login(params: LoginParams): Promise<LoginResult> {
    const { username, password, otpCode } = params;

    // --- Step 1: POST /api/User/login (x-www-form-urlencoded) ---
    const loginBody = new URLSearchParams();
    loginBody.append('Email', username);
    loginBody.append('PasswordHash', password);
    loginBody.append('GoogleRecaptchaTokenV3', '');

    const loginHeaders: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (otpCode) {
      loginHeaders['X-OTP'] = otpCode;
    }

    const loginRes = await fetch(`${this.apiUrl}/api/User/login`, {
      method: 'POST',
      headers: loginHeaders,
      body: loginBody.toString(),
      cache: 'no-store',
    });

    if (!loginRes.ok) {
      const err = await loginRes.json().catch(() => null);
      throw new Error(
        err?.error?.Message || err?.Message || 'Login validation failed.',
      );
    }

    const loginData = await loginRes.json();

    if (loginData.Success === false) {
      throw new Error(
        loginData.error?.Message || loginData.Message || 'Invalid credentials.',
      );
    }

    // --- Step 2: POST /token (x-www-form-urlencoded) ---
    const tokenBody = new URLSearchParams();
    tokenBody.append('client_id', this.clientId);
    tokenBody.append('username', username);
    tokenBody.append('grant_type', 'password');
    tokenBody.append('password', password);

    const tokenRes = await fetch(`${this.apiUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
      cache: 'no-store',
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => null);
      throw new Error(
        err?.error_description || 'Token exchange failed.',
      );
    }

    const tokenData = await tokenRes.json();

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      userName: tokenData.userName,
      fullName: tokenData.fullName || username,
      clientId: tokenData['as:client_id'] || this.clientId,
    };
  }

  async checkUserExists(
    token: string,
    email: string,
    applicationKey?: string,
  ): Promise<boolean> {
    const res = await fetch(`${this.apiUrl}/api/user/userExists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        IsExternalLogin: 'true',
      },
      body: JSON.stringify({
        Email: email,
        ...(applicationKey ? { ApplicationKey: applicationKey } : {}),
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized');
      // Treat other errors as non-fatal (matches gab-frontend behavior)
      return true;
    }

    const data = await res.json();
    return data?.userExists !== false;
  }

  async getProfile(token: string): Promise<UserProfile> {
    const res = await fetch(`${this.apiUrl}/api/User/getprofile`, {
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
    if (p.Role === 'super_admin' || p.IsAdmin === 1) {
      role = 'superadmin';
    } else if (p.Role === 'admin') {
      role = 'admin';
    } else if (Array.isArray(p.ApplicationRoles) && p.ApplicationRoles.length > 0) {
      role = 'admin';
    }

    return {
      id: String(p.Id ?? ''),
      email: p.Email || '',
      firstName: p.FirstName || '',
      lastName: p.LastName || '',
      role,
      isAdmin: role === 'admin' || role === 'superadmin',
    };
  }
}
