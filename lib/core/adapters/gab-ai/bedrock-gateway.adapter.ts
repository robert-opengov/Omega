import 'server-only';
import type {
  IAIGatewayPort,
  ConverseParams,
  ConverseResult,
  ConverseStreamChunk,
  InvokeParams,
  InvokeResult,
  AIMessage,
  AIUsage,
} from '../../ports/ai-gateway.port';
import {
  AIGatewayAuthError,
  AIGatewayQuotaError,
} from '../../ports/ai-gateway.port';

/**
 * Real adapter for the GAB Bedrock AI Gateway.
 *
 * Covers three proxy endpoints: /converse, /converse-stream, /invoke.
 * The bearer token is held in-process and never returned to callers.
 */
export class BedrockGatewayAdapter implements IAIGatewayPort {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly defaultModelId: string,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  converse                                                           */
  /* ------------------------------------------------------------------ */

  async converse(params: ConverseParams): Promise<ConverseResult> {
    const res = await this.post(
      this.modelPath(params.modelId, 'converse'),
      this.buildConverseBody(params),
    );
    await this.assertOk(res, 'converse');
    return this.normalizeConverse(await res.json());
  }

  /* ------------------------------------------------------------------ */
  /*  invoke                                                             */
  /* ------------------------------------------------------------------ */

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    const res = await this.post(
      this.modelPath(params.modelId, 'invoke'),
      params.body,
    );
    await this.assertOk(res, 'invoke');
    return res.json();
  }

  /* ------------------------------------------------------------------ */
  /*  converseStreamRaw — returns upstream Response for byte proxying    */
  /* ------------------------------------------------------------------ */

  async converseStreamRaw(params: ConverseParams): Promise<Response> {
    const res = await this.post(
      this.modelPath(params.modelId, 'converse-stream'),
      this.buildConverseBody(params),
    );
    await this.assertOk(res, 'converse-stream');
    return res;
  }

  /* ------------------------------------------------------------------ */
  /*  converseStream — parsed async iterator                            */
  /* ------------------------------------------------------------------ */

  async *converseStream(
    params: ConverseParams,
  ): AsyncIterable<ConverseStreamChunk> {
    const res = await this.converseStreamRaw(params);
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;

          const parsed = parseLine(line);
          if (parsed) yield this.normalizeChunk(parsed);
        }
      }
      if (buffer.trim()) {
        const parsed = parseLine(buffer.trim());
        if (parsed) yield this.normalizeChunk(parsed);
      }
    } finally {
      reader.releaseLock();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  private modelPath(
    modelId: string | undefined,
    op: 'converse' | 'converse-stream' | 'invoke',
  ): string {
    const id = modelId ?? this.defaultModelId;
    return `/model/${encodeURIComponent(id)}/${op}`;
  }

  private buildConverseBody(p: ConverseParams): Record<string, unknown> {
    return {
      messages: p.messages,
      ...(p.system ? { system: p.system } : {}),
      ...(p.inferenceConfig ? { inferenceConfig: p.inferenceConfig } : {}),
      ...(p.toolConfig ? { toolConfig: p.toolConfig } : {}),
    };
  }

  private post(path: string, body: unknown): Promise<Response> {
    if (!this.token) {
      throw new AIGatewayAuthError(
        'AI gateway not configured: AI_GATEWAY_TOKEN is missing.',
      );
    }
    return fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  }

  private async assertOk(res: Response, op: string): Promise<void> {
    if (res.ok) return;

    const detail = await res.text().catch(() => '');

    if (res.status === 401 || res.status === 403) {
      throw new AIGatewayAuthError(
        `AI gateway ${op} auth failed (${res.status}): ${detail}`,
      );
    }
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After')) || undefined;
      throw new AIGatewayQuotaError(
        `AI gateway ${op} rate limited (429): ${detail}`,
        retryAfter,
      );
    }

    throw new Error(`AI gateway ${op} failed (${res.status}): ${detail}`);
  }

  private normalizeConverse(data: Record<string, unknown>): ConverseResult {
    const output = data?.output as Record<string, unknown> | undefined;
    const message: AIMessage = (output?.message as AIMessage) ?? {
      role: 'assistant',
      content: [],
    };
    const text = (message.content ?? [])
      .map((b) => b?.text ?? '')
      .join('');

    return {
      text,
      message,
      stopReason: data?.stopReason as string | undefined,
      usage: normalizeUsage(data?.usage),
    };
  }

  private normalizeChunk(evt: Record<string, unknown>): ConverseStreamChunk {
    const delta = evt?.contentBlockDelta as Record<string, unknown> | undefined;
    const textDelta = (delta?.delta as Record<string, unknown>)?.text as
      | string
      | undefined;

    const messageStop = evt?.messageStop as Record<string, unknown> | undefined;
    const stopReason = messageStop?.stopReason as string | undefined;

    const metadata = evt?.metadata as Record<string, unknown> | undefined;
    const usage = normalizeUsage(metadata?.usage);

    return { textDelta, stopReason, usage, raw: evt };
  }
}

/* ------------------------------------------------------------------ */
/*  Shared utilities                                                   */
/* ------------------------------------------------------------------ */

function normalizeUsage(raw: unknown): AIUsage | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const u = raw as Record<string, number>;
  return {
    inputTokens: u.inputTokens ?? 0,
    outputTokens: u.outputTokens ?? 0,
    totalTokens: u.totalTokens ?? 0,
  };
}

/**
 * Parse a single line that could be NDJSON or SSE (`data: {…}`).
 */
function parseLine(line: string): Record<string, unknown> | null {
  let json = line;
  if (json.startsWith('data:')) {
    json = json.slice(5).trim();
  }
  if (!json || json === '[DONE]') return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
