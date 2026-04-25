import { IAuthPort } from '../../ports/auth.port';
import {
  GabUser,
  IGabUserRepository,
  ListUsersQuery,
  ListUsersResult,
  UpdateUserParams,
} from '../../ports/user.repository';

function normalize(user: any): GabUser {
  return {
    id: String(user?.id ?? ''),
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    active: Boolean(user?.active),
    isExternalUser: Boolean(user?.isExternalUser),
    twoFactorEnabled: Boolean(user?.twoFactorEnabled),
    tenantId: user?.tenantId ?? null,
    createdAt: user?.createdAt || '',
    updatedAt: user?.updatedAt || '',
  };
}

export class GabUserV2Adapter implements IGabUserRepository {
  constructor(private authPort: IAuthPort, private apiUrl: string) {}

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.authPort.getToken();
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Accept', 'application/json');

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

  async listUsers(query: ListUsersQuery = {}): Promise<ListUsersResult> {
    const sp = new URLSearchParams();
    if (query.search) sp.append('search', query.search);
    if (query.tenantId) sp.append('tenantId', query.tenantId);
    if (typeof query.active === 'boolean') sp.append('active', String(query.active));
    if (query.page) sp.append('page', String(query.page));
    if (query.pageSize) sp.append('pageSize', String(query.pageSize));
    const qs = sp.toString();

    const res = await this.fetchWithAuth(`/v2/users${qs ? `?${qs}` : ''}`);
    const items = Array.isArray(res?.items) ? res.items.map(normalize) : [];
    return {
      items,
      total: typeof res?.total === 'number' ? res.total : items.length,
      page: typeof res?.page === 'number' ? res.page : (query.page ?? 1),
      pageSize:
        typeof res?.pageSize === 'number' ? res.pageSize : (query.pageSize ?? items.length),
    };
  }

  async getUser(userId: string): Promise<GabUser> {
    const user = await this.fetchWithAuth(`/v2/users/${userId}`);
    return normalize(user);
  }

  async updateUser(userId: string, patch: UpdateUserParams): Promise<GabUser> {
    const user = await this.fetchWithAuth(`/v2/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    return normalize(user);
  }
}
