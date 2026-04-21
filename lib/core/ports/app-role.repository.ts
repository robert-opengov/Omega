export interface GabAppRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateAppRoleParams {
  name: string;
  description?: string;
}

export interface IGabAppRoleRepository {
  listRoles(appId: string): Promise<{ items: GabAppRole[]; total: number }>;
  createRole(appId: string, params: CreateAppRoleParams): Promise<GabAppRole>;
  getRole(appId: string, roleId: string): Promise<GabAppRole>;
}
