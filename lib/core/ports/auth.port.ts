export interface LoginParams {
  username: string;
  password: string;
  /** OTP code for 2FA — passed as X-OTP header when present */
  otpCode?: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  userName: string;
  fullName: string;
  clientId?: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'participant' | 'admin' | 'superadmin';
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
   * Registers a user against the backend's self-service signup flow.
   * Implementations normalize request and response shapes per backend version.
   */
  register(params: RegisterParams): Promise<RegisteredUser>;

  /**
   * Fetches the authenticated user's profile from the backend.
   * Used to hydrate role and identity fields after login.
   */
  getProfile(token: string): Promise<UserProfile>;

  /**
   * Checks whether an SSO-authenticated user exists in the GAB backend.
   * Used by the SSO callback flow to validate the user after Auth0 login.
   */
  checkUserExists(
    token: string,
    email: string,
    applicationKey?: string,
  ): Promise<boolean>;
}
