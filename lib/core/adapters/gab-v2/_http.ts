/**
 * Shared HTTP client for GAB V2 adapters.
 *
 * All v2 adapters use the same fetch + auth pattern; centralising it here
 * avoids drift and reduces the per-adapter boilerplate to a single import.
 *
 * Server-only: imports are not safe in client components (uses the auth port,
 * which reads cookies via the composition root).
 */

import type { IAuthPort } from '../../ports/auth.port';

export interface GabFetchOptions extends RequestInit {
  /** Treat HTTP 404 as `null` instead of throwing. Useful for "may not exist" reads. */
  allow404?: boolean;
}

export class GabV2Http {
  constructor(
    private readonly authPort: IAuthPort,
    private readonly apiUrl: string,
  ) {}

  /**
   * Fetch a JSON endpoint with the current user's bearer token.
   * Throws on non-2xx unless `allow404` is set.
   */
  async json<T>(endpoint: string, options: GabFetchOptions = {}): Promise<T> {
    const token = await this.authPort.getToken();
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Accept', 'application/json');

    const { allow404, ...rest } = options;

    const res = await fetch(`${this.apiUrl}${endpoint}`, {
      ...rest,
      headers,
    });

    if (allow404 && res.status === 404) {
      return null as T;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const message =
        err?.message || err?.error || `GAB V2 ${res.status}: ${res.statusText}`;
      throw new Error(message);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  /** Build a query string from a record, skipping null/undefined/empty values. */
  static qs(params: Record<string, string | number | boolean | undefined | null>): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      sp.append(k, String(v));
    }
    const out = sp.toString();
    return out ? `?${out}` : '';
  }
}
