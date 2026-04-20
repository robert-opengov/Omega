/**
 * Centralized GAB platform configuration.
 * All GAB API env vars are read here — adapters and actions import
 * from this file instead of reading process.env directly.
 *
 * Server-only: never import this from client components.
 *
 * The API URL is auto-resolved from GAB_API_VERSION:
 *   v1 → https://devapi.ignatius.io     (legacy)
 *   v2 → https://gab-core-api.gab.ogintegration.us  (default)
 *
 * Override with GAB_API_URL for custom deployments.
 */

const DEFAULT_API_URLS: Record<string, string> = {
  v1: 'https://devapi.ignatius.io',
  v2: 'https://gab-core-api.gab.ogintegration.us',
};

const apiVersion = (process.env.GAB_API_VERSION || 'v2') as 'v1' | 'v2';

export const gabConfig = {
  /** 'v1' (legacy) or 'v2' (default). Controls which adapters are used. */
  apiVersion,

  /** Auto-resolved from apiVersion. Override with GAB_API_URL for custom deployments. */
  apiUrl: process.env.GAB_API_URL || DEFAULT_API_URLS[apiVersion] || '',

  /** V1-only: OAuth client_id for /token request. Not used by V2 adapters. */
  clientId: process.env.GAB_CLIENT_ID || '',

  /** Service account for server-to-server operations (M2M) */
  serviceAccount: {
    username: process.env.GAB_SERVICE_USERNAME || '',
    password: process.env.GAB_SERVICE_PASSWORD || '',
  },

  // --- App-specific keys (AI/dev fills these in per vertical) ---
  // appKey: process.env.GAB_APP_KEY || '',
  // tableKeys: {
  //   serviceRequests: process.env.GAB_TABLE_SERVICE_REQUESTS || '',
  //   activities: process.env.GAB_TABLE_ACTIVITIES || '',
  // },
} as const;

export type GabConfig = typeof gabConfig;
