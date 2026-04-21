import { IAuthPort } from '../../ports/auth.port';
import { CreateAppRoleParams, GabAppRole, IGabAppRoleRepository } from '../../ports/app-role.repository';

/**
 * Intentional rollout policy: app-role resource support is being added only
 * for v2 flows in this phase, even though legacy v1 equivalents existed.
 */
export class GabAppRoleV1Adapter implements IGabAppRoleRepository {
  constructor(
    private _authPort: IAuthPort,
    private _apiUrl: string,
  ) {}

  async listRoles(_appId: string): Promise<{ items: GabAppRole[]; total: number }> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async createRole(_appId: string, _params: CreateAppRoleParams): Promise<GabAppRole> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }

  async getRole(_appId: string, _roleId: string): Promise<GabAppRole> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }
}
