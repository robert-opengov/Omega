/**
 * Public access port — public form/page links and tenant-scoped API tokens.
 *
 * Both surfaces are app-scoped under `/v2/apps/:appId/...`:
 *   - public-links: public URLs that point to a form or page key.
 *   - public-access-tokens: bearer tokens minted for programmatic access,
 *     bound to an app role.
 *
 * Notable wire-shape quirk: list endpoints use different envelope keys.
 *   GET /public-links       -> { items, total }
 *   GET /public-access-tokens -> { tokens }
 */

export interface PublicLink {
  id: string;
  token: string;
  type: 'form' | 'page';
  formKey: string | null;
  pageKey: string | null;
  name: string;
  active: boolean;
  expiresAt: string | null;
  settings: Record<string, unknown> | null;
  submissionCount: number;
  maxSubmissions: number | null;
  publicAccessTokenId: string | null;
  roleId: string | null;
  roleName: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreatePublicLinkPayload {
  type: 'form' | 'page';
  /** One of `formKey` or `pageKey` is required, depending on `type`. */
  formKey?: string;
  pageKey?: string;
  name: string;
  roleId?: string | null;
  maxSubmissions?: number | null;
  settings?: Record<string, unknown> | null;
  expiresAt?: string | null;
}

export interface PublicAccessToken {
  id: string;
  appId: string;
  /**
   * On `createToken` this is the FULL token string (display once).
   * On `listTokens` adapters typically receive a masked or truncated value.
   */
  token: string;
  name: string;
  active: boolean;
  expiresAt: string | null;
  rateLimit: number | null;
  roleId: string | null;
  roleName: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreatePublicAccessTokenPayload {
  name: string;
  roleId?: string | null;
  rateLimit?: number | null;
  /** ISO-8601, omit / null for "never". */
  expiresAt?: string | null;
}

export interface UpdatePublicAccessTokenPayload {
  /** GAB Core only supports updating the bound role today. */
  roleId: string | null;
}

export interface IGabPublicAccessRepository {
  // -- Public links -------------------------------------------------------
  listLinks(appId: string): Promise<{ items: PublicLink[]; total: number }>;
  createLink(appId: string, payload: CreatePublicLinkPayload): Promise<PublicLink>;
  deleteLink(appId: string, linkId: string): Promise<{ ok: boolean }>;

  // -- API access tokens --------------------------------------------------
  listTokens(appId: string): Promise<{ tokens: PublicAccessToken[] }>;
  createToken(
    appId: string,
    payload: CreatePublicAccessTokenPayload,
  ): Promise<PublicAccessToken>;
  updateToken(
    appId: string,
    tokenId: string,
    payload: UpdatePublicAccessTokenPayload,
  ): Promise<PublicAccessToken>;
  deleteToken(appId: string, tokenId: string): Promise<{ ok: boolean }>;
}
