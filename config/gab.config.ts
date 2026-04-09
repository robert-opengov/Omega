/**
 * Centralized GAB platform configuration.
 * All GAB API env vars are read here — adapters and actions import
 * from this file instead of reading process.env directly.
 *
 * Server-only: never import this from client components.
 *
 * AI or developer adds application keys, table keys, and other
 * runtime identifiers here as the generated app evolves.
 */
export const gabConfig = {
  /** Base URL for all GAB API calls (/token, /api/*) */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',

  /** OAuth client_id sent with every /token request */
  clientId: process.env.GAB_CLIENT_ID || 'IAFConsulting',

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
