export interface GabUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  isExternalUser: boolean;
  twoFactorEnabled: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  twoFactorEnabled?: boolean;
  active?: boolean;
}

export interface IGabUserRepository {
  updateUser(userId: string, patch: UpdateUserParams): Promise<GabUser>;
}
