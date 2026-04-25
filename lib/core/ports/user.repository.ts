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

export interface ListUsersQuery {
  search?: string;
  tenantId?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListUsersResult {
  items: GabUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IGabUserRepository {
  listUsers(query?: ListUsersQuery): Promise<ListUsersResult>;
  getUser(userId: string): Promise<GabUser>;
  updateUser(userId: string, patch: UpdateUserParams): Promise<GabUser>;
}
