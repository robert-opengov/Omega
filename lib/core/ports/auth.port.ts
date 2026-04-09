export interface LoginParams {
  username: string;
  password: string;
  /** OTP code for 2FA — passed as X-OTP header when present */
  otpCode?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  userName: string;
  fullName: string;
  clientId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'participant' | 'admin' | 'superadmin';
  isAdmin: boolean;
}

export interface IAuthPort {
  /**
   * Retrieves the current authentication token from the session.
   * This could be a user token (pass-through) or a service token (M2M).
   */
  getToken(): Promise<string | null>;

  /**
   * Authenticates a user against the GAB backend.
   * Adapter implementations handle all API-specific details
   * (endpoints, encoding, multi-step flows, etc.).
   */
  login(params: LoginParams): Promise<LoginResult>;

  /**
   * Fetches the authenticated user's profile from the backend.
   * Used to hydrate role and identity fields after login.
   */
  getProfile(token: string): Promise<UserProfile>;
}
