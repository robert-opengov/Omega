/**
 * GAB Bedrock AI Gateway configuration.
 *
 * Server-only: never import this from client components.
 * All AI gateway env vars are read here — adapters and actions
 * import from this file instead of reading process.env directly.
 */
export const aiGatewayConfig = {
  /** Base URL for the AI gateway (no trailing slash). */
  baseUrl:
    process.env.AI_GATEWAY_BASE_URL ||
    'https://gab-bedrock-ai-gateway.gab-test.com',

  /** Long-lived bearer token (gab_…). Stored in SSM, injected at runtime. */
  token: process.env.AI_GATEWAY_TOKEN || '',

  /** Default Bedrock model used when callers omit modelId. */
  defaultModelId:
    process.env.AI_GATEWAY_DEFAULT_MODEL ||
    'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
} as const;

export type AIGatewayConfig = typeof aiGatewayConfig;
