import { IAuthPort } from '../../ports/auth.port';
import { GabUser, IGabUserRepository, UpdateUserParams } from '../../ports/user.repository';

/**
 * Intentional rollout policy: user update support is being added only for v2
 * flows in this phase, even though legacy v1 equivalents existed historically.
 */
export class GabUserV1Adapter implements IGabUserRepository {
  constructor(
    private _authPort: IAuthPort,
    private _apiUrl: string,
  ) {}

  async updateUser(_userId: string, _patch: UpdateUserParams): Promise<GabUser> {
    throw new Error('Not supported when GAB_API_VERSION=v1');
  }
}
