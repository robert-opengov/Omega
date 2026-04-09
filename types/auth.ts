export type GabRole = 'participant' | 'admin' | 'superadmin';

export interface User {
  userName: string;
  fullName: string;
  clientId: string;
  role: GabRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  expiresIn: number;
  expiresAt: string;
}
