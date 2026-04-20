/* ------------------------------------------------------------------ */
/*  Domain types — Bedrock Converse shape                              */
/* ------------------------------------------------------------------ */

export type AIRole = 'user' | 'assistant';

export interface AITextBlock {
  text: string;
}

export interface AIMessage {
  role: AIRole;
  content: AITextBlock[];
}

export interface AISystemBlock {
  text: string;
}

export interface AIInferenceConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface AIToolSpec {
  name: string;
  description?: string;
  inputSchema: { json: Record<string, unknown> };
}

export interface AIToolConfig {
  tools: { toolSpec: AIToolSpec }[];
  toolChoice?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Converse                                                           */
/* ------------------------------------------------------------------ */

export interface ConverseParams {
  /** Override default model id. Falls back to AI_GATEWAY_DEFAULT_MODEL. */
  modelId?: string;
  messages: AIMessage[];
  system?: AISystemBlock[];
  inferenceConfig?: AIInferenceConfig;
  toolConfig?: AIToolConfig;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ConverseResult {
  /** Concatenated assistant text — convenience for simple chat UIs. */
  text: string;
  /** Raw assistant message preserved for tool-use round-trips. */
  message: AIMessage;
  stopReason?: string;
  usage?: AIUsage;
}

/* ------------------------------------------------------------------ */
/*  Invoke (raw escape hatch)                                          */
/* ------------------------------------------------------------------ */

export interface InvokeParams {
  /** Override default model id. Falls back to AI_GATEWAY_DEFAULT_MODEL. */
  modelId?: string;
  /** Model-specific body (e.g. anthropic_version, max_tokens, …). */
  body: Record<string, unknown>;
}

export type InvokeResult = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/*  Streaming                                                          */
/* ------------------------------------------------------------------ */

export interface ConverseStreamChunk {
  /** Incremental assistant text fragment, when present. */
  textDelta?: string;
  /** Stop reason on the final chunk. */
  stopReason?: string;
  /** Token usage on the final chunk. */
  usage?: AIUsage;
  /** Raw upstream event for advanced consumers (tool use, metadata). */
  raw?: unknown;
}

/* ------------------------------------------------------------------ */
/*  Typed errors                                                       */
/* ------------------------------------------------------------------ */

export class AIGatewayAuthError extends Error {
  constructor(message = 'AI gateway authentication failed') {
    super(message);
    this.name = 'AIGatewayAuthError';
  }
}

export class AIGatewayQuotaError extends Error {
  public readonly retryAfter?: number;
  constructor(message = 'AI gateway rate limit exceeded', retryAfter?: number) {
    super(message);
    this.name = 'AIGatewayQuotaError';
    this.retryAfter = retryAfter;
  }
}

/* ------------------------------------------------------------------ */
/*  Port interface                                                     */
/* ------------------------------------------------------------------ */

export interface IAIGatewayPort {
  /** Standard Bedrock Converse call (sync, with optional system/tools). */
  converse(params: ConverseParams): Promise<ConverseResult>;

  /** Raw model-specific invoke (/invoke endpoint). */
  invoke(params: InvokeParams): Promise<InvokeResult>;

  /** Parsed async iterator of stream chunks. */
  converseStream(params: ConverseParams): AsyncIterable<ConverseStreamChunk>;

  /** Low-level: returns the upstream Response for byte-for-byte proxying. */
  converseStreamRaw(params: ConverseParams): Promise<Response>;
}
