import { IAuthPort } from '../../ports/auth.port';
import {
  GabUser,
  IGabUserRepository,
  ListUsersQuery,
  ListUsersResult,
  UpdateUserParams,
} from '../../ports/user.repository';

/**
 * Intentional rollout policy: user management is being added only for v2
 * flows in this phase, even though legacy v1 equivalents existed historically.
 */
function notSupported(): Promise<never> {
  return Promise.reject(new Error('Not supported when GAB_API_VERSION=v1'));
}

export class GabUserV1Adapter implements IGabUserRepository {
  constructor(
    private _authPort: IAuthPort,
    private _apiUrl: string,
  ) {}

  listUsers(_query?: ListUsersQuery): Promise<ListUsersResult> {
    return notSupported();
  }

  getUser(_userId: string): Promise<GabUser> {
    return notSupported();
  }

  updateUser(_userId: string, _patch: UpdateUserParams): Promise<GabUser> {
    return notSupported();
  }
}
