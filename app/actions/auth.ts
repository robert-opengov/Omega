'use server';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '@/lib/constants';
import { authPort } from '@/lib/core';
import { gabConfig } from '@/config/gab.config';
import { authConfig } from '@/config/auth.config';

export interface SessionUser {
  userId: string;
  email: string;
  userName: string;
  fullName: string;
  clientId?: string;
  role: 'participant' | 'admin' | 'superadmin';
}

/**
 * Reads the current session from HTTP-only cookies.
 * Returns `null` when no valid session exists.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  if (!token) return null;

  const raw = cookieStore.get(AUTH_COOKIE_NAMES.userInfo)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Authenticates a user via the Clean Architecture auth port,
 * then persists the session as HTTP-only cookies.
 *
 * This Server Action knows nothing about V1 endpoints or encoding —
 * all API details live in the adapter (lib/core/adapters/).
 */
export async function loginAction(
  username: string,
  password: string,
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  if (authConfig.loginMode === 'sso') {
    return { success: false, error: 'Password login is disabled for this application.' };
  }

  try {
    const loginResult = await authPort.login({ username, password });

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set(AUTH_COOKIE_NAMES.accessToken, loginResult.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: loginResult.expiresIn,
      path: '/',
    });

    if (loginResult.refreshToken) {
      cookieStore.set(AUTH_COOKIE_NAMES.refreshToken, loginResult.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    let userId = '';
    let email = '';
    let fullName = loginResult.fullName;
    let role: SessionUser['role'] = 'participant';

    try {
      const profile = await authPort.getProfile(loginResult.accessToken);
      userId = profile.id;
      email = profile.email;
      role = profile.role;
      if (profile.firstName && profile.lastName) {
        fullName = `${profile.firstName} ${profile.lastName}`;
      }
    } catch {
      // Profile hydration failed — continue with token-level data
    }

    const user: SessionUser = {
      userId,
      email,
      userName: loginResult.userName,
      fullName,
      clientId: loginResult.clientId,
      role,
    };

    cookieStore.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify(user), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: loginResult.expiresIn,
      path: '/',
    });

    return { success: true, user };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An error occurred during login.';
    console.error('Login action error:', message);
    return { success: false, error: message };
  }
}

/**
 * Destroys the session by clearing all auth cookies.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAMES.accessToken);
  cookieStore.delete(AUTH_COOKIE_NAMES.refreshToken);
  cookieStore.delete(AUTH_COOKIE_NAMES.userInfo);
  cookieStore.delete(AUTH_COOKIE_NAMES.authProvider);
}

// ---------------------------------------------------------------------------
// SSO (Auth0) Actions
// ---------------------------------------------------------------------------

/**
 * Called from the callback-handler page after Auth0 returns tokens.
 * Bridges the client-side Auth0 SDK and server-side HTTP-only cookies.
 */
export async function ssoCallbackAction(
  accessToken: string,
  expiresIn: number,
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  if (authConfig.loginMode === 'password') {
    return { success: false, error: 'SSO login is disabled for this application.' };
  }

  try {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set(AUTH_COOKIE_NAMES.accessToken, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    cookieStore.set(AUTH_COOKIE_NAMES.authProvider, 'sso', {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    let userId = '';
    let email = '';
    let fullName = '';
    let role: SessionUser['role'] = 'participant';

    try {
      const profile = await authPort.getProfile(accessToken);
      userId = profile.id;
      email = profile.email;
      role = profile.role;
      if (profile.firstName && profile.lastName) {
        fullName = `${profile.firstName} ${profile.lastName}`;
      }
    } catch {
      // Profile hydration failed — continue with minimal data
    }

    const user: SessionUser = {
      userId,
      email,
      userName: email,
      fullName,
      clientId: gabConfig.clientId || undefined,
      role,
    };

    cookieStore.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify(user), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    return { success: true, user };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'SSO callback failed.';
    console.error('SSO callback action error:', message);
    return { success: false, error: message };
  }
}

/**
 * Checks whether an SSO user exists in the GAB backend.
 * Called from the callback-handler after Auth0 authentication succeeds.
 */
export async function checkUserExistsAction(
  token: string,
  email: string,
  applicationKey?: string,
): Promise<boolean> {
  try {
    return await authPort.checkUserExists(token, email, applicationKey);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return false;
    }
    // Non-fatal — treat as existing (matches gab-frontend behavior)
    return true;
  }
}
