import type { IAuthPort } from '../../ports/auth.port';
import type {
  IGabPublicAccessRepository,
  PublicLink,
  PublicAccessToken,
  CreatePublicLinkPayload,
  CreatePublicAccessTokenPayload,
  UpdatePublicAccessTokenPayload,
} from '../../ports/public-access.repository';
import { GabV2Http } from './_http';

function normalizeLink(raw: any): PublicLink {
  return {
    id: String(raw.id ?? ''),
    token: String(raw.token ?? ''),
    type: raw.type === 'page' ? 'page' : 'form',
    formKey: raw.formKey ?? null,
    pageKey: raw.pageKey ?? null,
    name: String(raw.name ?? ''),
    active: Boolean(raw.active),
    expiresAt: raw.expiresAt ?? null,
    settings: raw.settings ?? null,
    submissionCount: Number(raw.submissionCount ?? 0),
    maxSubmissions: raw.maxSubmissions ?? null,
    publicAccessTokenId: raw.publicAccessTokenId ?? null,
    roleId: raw.roleId ?? null,
    roleName: raw.roleName ?? null,
    createdBy: raw.createdBy ?? null,
    createdAt: String(raw.createdAt ?? ''),
  };
}

function normalizeToken(raw: any): PublicAccessToken {
  return {
    id: String(raw.id ?? ''),
    appId: String(raw.appId ?? ''),
    token: String(raw.token ?? ''),
    name: String(raw.name ?? ''),
    active: Boolean(raw.active),
    expiresAt: raw.expiresAt ?? null,
    rateLimit: raw.rateLimit ?? null,
    roleId: raw.roleId ?? null,
    roleName: raw.roleName ?? null,
    createdBy: raw.createdBy ?? null,
    createdAt: String(raw.createdAt ?? ''),
  };
}

export class GabPublicAccessV2Adapter implements IGabPublicAccessRepository {
  private readonly http: GabV2Http;

  constructor(authPort: IAuthPort, apiUrl: string) {
    this.http = new GabV2Http(authPort, apiUrl);
  }

  async listLinks(appId: string): Promise<{ items: PublicLink[]; total: number }> {
    const res = await this.http.json<{ items?: any[]; total?: number }>(
      `/v2/apps/${appId}/public-links`,
    );
    return {
      items: Array.isArray(res?.items) ? res.items.map(normalizeLink) : [],
      total: Number(res?.total ?? 0),
    };
  }

  async createLink(appId: string, payload: CreatePublicLinkPayload): Promise<PublicLink> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/public-links`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeLink(res);
  }

  async deleteLink(appId: string, linkId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/public-links/${linkId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }

  async listTokens(appId: string): Promise<{ tokens: PublicAccessToken[] }> {
    const res = await this.http.json<{ tokens?: any[] }>(
      `/v2/apps/${appId}/public-access-tokens`,
    );
    return {
      tokens: Array.isArray(res?.tokens) ? res.tokens.map(normalizeToken) : [],
    };
  }

  async createToken(
    appId: string,
    payload: CreatePublicAccessTokenPayload,
  ): Promise<PublicAccessToken> {
    const res = await this.http.json<any>(`/v2/apps/${appId}/public-access-tokens`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeToken(res);
  }

  async updateToken(
    appId: string,
    tokenId: string,
    payload: UpdatePublicAccessTokenPayload,
  ): Promise<PublicAccessToken> {
    const res = await this.http.json<any>(
      `/v2/apps/${appId}/public-access-tokens/${tokenId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    return normalizeToken(res);
  }

  async deleteToken(appId: string, tokenId: string): Promise<{ ok: boolean }> {
    await this.http.json(`/v2/apps/${appId}/public-access-tokens/${tokenId}`, {
      method: 'DELETE',
    });
    return { ok: true };
  }
}
