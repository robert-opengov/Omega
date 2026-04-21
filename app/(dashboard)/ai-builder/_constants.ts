export const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful AI assistant integrated into a Government Application Builder (GAB). ' +
  'You help government professionals design application schemas, create tables, define fields, ' +
  'and plan data models. Be concise, precise, and follow best practices for government software.';

export const MODEL_OPTIONS = [
  { value: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0', label: 'Claude Sonnet 4.5' },
  { value: 'us.anthropic.claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'us.anthropic.claude-haiku-4-20250414', label: 'Claude Haiku 4' },
] as const;

export const INFERENCE_DEFAULTS = {
  temperature: 0.7,
  maxTokens: 4096,
} as const;

export const SYSTEM_PROMPT_MAX_LENGTH = 4000;
export const MESSAGE_MAX_LENGTH = 4000;
