import { IAuthPort } from '../../ports/auth.port';
import { CreateAppRoleParams, GabAppRole, IGabAppRoleRepository } from '../../ports/app-role.repository';

function normalizeRole(role: any): GabAppRole {
  return {
    id: String(role.id ?? ''),
    name: role.name || '',
    description: role.description ?? null,
    isSystem: Boolean(role.isSystem),
    createdAt: role.createdAt || '',
  };
}

export class GabAppRoleV2Adapter implements IGabAppRoleRepository {
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
      throw new Error(err?.message || err?.error || `GAB App Role API Error: ${res.statusText}`);
    }

    return res.json();
  }

  async listRoles(appId: string): Promise<{ items: GabAppRole[]; total: number }> {
    const response = await this.fetchWithAuth(`/v2/apps/${appId}/roles`, {
      method: 'GET',
    });

    return {
      items: Array.isArray(response.items) ? response.items.map(normalizeRole) : [],
      total: Number(response.total ?? 0),
    };
  }

  async createRole(appId: string, params: CreateAppRoleParams): Promise<GabAppRole> {
    const response = await this.fetchWithAuth(`/v2/apps/${appId}/roles`, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    return normalizeRole(response);
  }

  async getRole(appId: string, roleId: string): Promise<GabAppRole> {
    const response = await this.fetchWithAuth(`/v2/apps/${appId}/roles/${roleId}`, {
      method: 'GET',
    });

    return normalizeRole(response);
  }
}
