/**
 * Tenant (company) port — multi-tenant orgs that own apps.
 *
 * Surfaced as "Companies" in the GAB Core admin UI. Most non-admin users
 * only ever see one tenant; super-admins manage the directory.
 */

export interface GabTenant {
  id: string;
  name: string;
  slug?: string;
  createdAt?: string;
}

export interface CreateTenantPayload {
  name: string;
  slug?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  slug?: string;
}

export interface IGabTenantRepository {
  listTenants(): Promise<{ items: GabTenant[]; total: number }>;
  getTenant(tenantId: string): Promise<GabTenant>;
  createTenant(payload: CreateTenantPayload): Promise<GabTenant>;
  updateTenant(tenantId: string, payload: UpdateTenantPayload): Promise<GabTenant>;
}
