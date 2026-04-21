import { IAuthPort } from '../../ports/auth.port';
import { GabUser, IGabUserRepository, UpdateUserParams } from '../../ports/user.repository';

export class GabUserV2Adapter implements IGabUserRepository {
  constructor(private authPort: IAuthPort, private apiUrl: string) {}

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.authPort.getToken();
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const res = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || err?.error || `GAB User API Error: ${res.statusText}`);
    }

    return res.json();
  }

  async updateUser(userId: string, patch: UpdateUserParams): Promise<GabUser> {
    const user = await this.fetchWithAuth(`/v2/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });

    return {
      id: String(user.id ?? ''),
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      active: Boolean(user.active),
      isExternalUser: Boolean(user.isExternalUser),
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      tenantId: user.tenantId ?? null,
      createdAt: user.createdAt || '',
      updatedAt: user.updatedAt || '',
    };
  }
}
