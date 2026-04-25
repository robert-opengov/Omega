'use server';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '@/lib/constants';
import { authPort, gabUserRepo } from '@/lib/core';
import { gabConfig } from '@/config/gab.config';
import { authConfig } from '@/config/auth.config';
import type { RegisterParams, RegisteredUser } from '@/lib/core/ports/auth.port';
import type { GabUser, UpdateUserParams } from '@/lib/core/ports/user.repository';

export interface SessionUser {
  userId: string;
  email: string;
  userName: string;
  fullName: string;
  clientId?: string;
  role: 'participant' | 'admin' | 'superadmin';
}

export interface ImpersonationSession {
  userId: string;
  roleId: string;
  startedAt: string;
}

function parseImpersonationCookie(raw: string | undefined): ImpersonationSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ImpersonationSession>;
    if (!parsed.userId || !parsed.roleId || !parsed.startedAt) return null;
    return {
      userId: String(parsed.userId),
      roleId: String(parsed.roleId),
      startedAt: String(parsed.startedAt),
    };
  } catch {
    return null;
  }
}

function getUserFullName(firstName: string, lastName: string, fallback: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || fallback;
}

function getTokenMaxAge(token: string | undefined): number | undefined {
  if (!token) return undefined;

  try {
    const [, payload] = token.split('.');
    if (!payload) return undefined;

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
    };

    if (typeof parsed.exp !== 'number') return undefined;
    return Math.max(Math.floor(parsed.exp - Date.now() / 1000), 1);
  } catch {
    return undefined;
  }
}

async function writeUserInfoCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  user: SessionUser,
  maxAge?: number,
) {
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(AUTH_COOKIE_NAMES.userInfo, JSON.stringify(user), {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    ...(maxAge ? { maxAge } : {}),
    path: '/',
  });
}

async function hydrateSessionUser(
  accessToken: string,
  fallback: {
    userName: string;
    fullName: string;
    clientId?: string;
  },
): Promise<SessionUser> {
  let userId = '';
  let email = '';
  let fullName = fallback.fullName;
  let role: SessionUser['role'] = 'participant';

  try {
    const profile = await authPort.getProfile(accessToken);
    userId = profile.id;
    email = profile.email;
    role = profile.role;
    fullName = getUserFullName(profile.firstName, profile.lastName, fallback.fullName);
  } catch {
    // Profile hydration failed — continue with token-level data
  }

  return {
    userId,
    email,
    userName: fallback.userName || email,
    fullName,
    clientId: fallback.clientId,
    role,
  };
}

function sessionUserFromGabUser(currentUser: SessionUser, updatedUser: GabUser): SessionUser {
  return {
    userId: updatedUser.id || currentUser.userId,
    email: updatedUser.email || currentUser.email,
    userName: currentUser.userName,
    fullName: getUserFullName(updatedUser.firstName, updatedUser.lastName, currentUser.fullName),
    clientId: currentUser.clientId,
    role: currentUser.role,
  };
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

    const user = await hydrateSessionUser(loginResult.accessToken, {
      userName: loginResult.userName,
      fullName: loginResult.fullName,
      clientId: loginResult.clientId,
    });

    await writeUserInfoCookie(cookieStore, user, loginResult.expiresIn);

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
  cookieStore.delete(AUTH_COOKIE_NAMES.impersonationContext);
}

export async function getImpersonationAction(): Promise<ImpersonationSession | null> {
  const cookieStore = await cookies();
  return parseImpersonationCookie(
    cookieStore.get(AUTH_COOKIE_NAMES.impersonationContext)?.value,
  );
}

export async function startImpersonationAction(
  userId: string,
  roleId: string,
): Promise<{ success: boolean; data?: ImpersonationSession; error?: string }> {
  const nextUserId = userId.trim();
  const nextRoleId = roleId.trim();
  if (!nextUserId || !nextRoleId) {
    return { success: false, error: 'User and role are required.' };
  }
  const session: ImpersonationSession = {
    userId: nextUserId,
    roleId: nextRoleId,
    startedAt: new Date().toISOString(),
  };
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  cookieStore.set(
    AUTH_COOKIE_NAMES.impersonationContext,
    JSON.stringify(session),
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    },
  );
  return { success: true, data: session };
}

export async function stopImpersonationAction(): Promise<{ success: true }> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAMES.impersonationContext);
  return { success: true };
}

export async function registerAction(
  params: RegisterParams,
): Promise<{ success: boolean; user?: RegisteredUser; error?: string }> {
  try {
    const user = await authPort.register(params);
    return { success: true, user };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Registration failed.';
    console.error('Register action error:', message);
    return { success: false, error: message };
  }
}

export async function updateProfileAction(
  params: Pick<UpdateUserParams, 'firstName' | 'lastName'>,
): Promise<{ success: boolean; user?: GabUser; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser?.userId) {
    return { success: false, error: 'No user session found.' };
  }

  try {
    const updatedUser = await gabUserRepo.updateUser(currentUser.userId, params);
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
    await writeUserInfoCookie(
      cookieStore,
      sessionUserFromGabUser(currentUser, updatedUser),
      getTokenMaxAge(accessToken),
    );
    return { success: true, user: updatedUser };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update profile.';
    console.error('Update profile action error:', message);
    return { success: false, error: message };
  }
}

export async function setTwoFactorEnabledAction(
  enabled: boolean,
): Promise<{ success: boolean; user?: GabUser; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser?.userId) {
    return { success: false, error: 'No user session found.' };
  }

  try {
    const updatedUser = await gabUserRepo.updateUser(currentUser.userId, {
      twoFactorEnabled: enabled,
    });
    return { success: true, user: updatedUser };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update two-factor settings.';
    console.error('Two-factor action error:', message);
    return { success: false, error: message };
  }
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

    const user = await hydrateSessionUser(accessToken, {
      userName: '',
      fullName: '',
      clientId: gabConfig.clientId || undefined,
    });

    await writeUserInfoCookie(cookieStore, user, expiresIn);

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
