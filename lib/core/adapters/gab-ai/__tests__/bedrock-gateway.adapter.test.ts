import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BedrockGatewayAdapter } from '../bedrock-gateway.adapter';
import {
  AIGatewayAuthError,
  AIGatewayQuotaError,
} from '../../../ports/ai-gateway.port';
import type { ConverseParams } from '../../../ports/ai-gateway.port';

const BASE_URL = 'https://test-gateway.example.com';
const TOKEN = 'gab_test_token_abc123';
const DEFAULT_MODEL = 'global.anthropic.claude-sonnet-4-5-20250929-v1:0';

function adapter(token = TOKEN) {
  return new BedrockGatewayAdapter(BASE_URL, token, DEFAULT_MODEL);
}

function simpleParams(overrides?: Partial<ConverseParams>): ConverseParams {
  return {
    messages: [
      { role: 'user', content: [{ text: 'Hello' }] },
    ],
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/* ------------------------------------------------------------------ */
/*  converse                                                           */
/* ------------------------------------------------------------------ */

describe('BedrockGatewayAdapter — converse', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the default model when modelId is omitted', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        output: { message: { role: 'assistant', content: [{ text: 'Hi' }] } },
        stopReason: 'end_turn',
      }),
    );

    await adapter().converse(simpleParams());

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain(`/model/${encodeURIComponent(DEFAULT_MODEL)}/converse`);
  });

  it('uses custom modelId when provided', async () => {
    const customModel = 'us.anthropic.claude-sonnet-4-20250514';
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        output: { message: { role: 'assistant', content: [{ text: 'Hi' }] } },
      }),
    );

    await adapter().converse(simpleParams({ modelId: customModel }));

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain(`/model/${encodeURIComponent(customModel)}/converse`);
    expect(url).not.toContain(DEFAULT_MODEL);
  });

  it('passes system prompt through', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        output: { message: { role: 'assistant', content: [{ text: 'OK' }] } },
      }),
    );

    await adapter().converse(
      simpleParams({ system: [{ text: 'Be concise.' }] }),
    );

    const body = JSON.parse(
      (vi.mocked(globalThis.fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.system).toEqual([{ text: 'Be concise.' }]);
  });

  it('passes toolConfig through', async () => {
    const toolConfig = {
      tools: [
        {
          toolSpec: {
            name: 'get_weather',
            description: 'Get weather',
            inputSchema: {
              json: { type: 'object', properties: { city: { type: 'string' } } },
            },
          },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        output: { message: { role: 'assistant', content: [{ text: 'Use tool' }] } },
      }),
    );

    await adapter().converse(simpleParams({ toolConfig }));

    const body = JSON.parse(
      (vi.mocked(globalThis.fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.toolConfig).toEqual(toolConfig);
  });

  it('normalizes a successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        output: {
          message: {
            role: 'assistant',
            content: [{ text: 'Hello ' }, { text: 'world' }],
          },
        },
        stopReason: 'end_turn',
        usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
      }),
    );

    const result = await adapter().converse(simpleParams());
    expect(result.text).toBe('Hello world');
    expect(result.message.role).toBe('assistant');
    expect(result.stopReason).toBe('end_turn');
    expect(result.usage).toEqual({ inputTokens: 5, outputTokens: 10, totalTokens: 15 });
  });

  it('never leaks the token in results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        output: { message: { role: 'assistant', content: [{ text: 'OK' }] } },
      }),
    );

    const result = await adapter().converse(simpleParams());
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(TOKEN);
  });
});

/* ------------------------------------------------------------------ */
/*  Error handling                                                     */
/* ------------------------------------------------------------------ */

describe('BedrockGatewayAdapter — error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws AIGatewayAuthError on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Unauthorized' }, 401),
    );

    await expect(adapter().converse(simpleParams())).rejects.toThrow(AIGatewayAuthError);
  });

  it('throws AIGatewayAuthError on 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Forbidden' }, 403),
    );

    await expect(adapter().converse(simpleParams())).rejects.toThrow(AIGatewayAuthError);
  });

  it('throws AIGatewayQuotaError on 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Rate limited', {
        status: 429,
        headers: { 'Retry-After': '30' },
      }),
    );

    try {
      await adapter().converse(simpleParams());
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIGatewayQuotaError);
      expect((err as AIGatewayQuotaError).retryAfter).toBe(30);
    }
  });

  it('throws AIGatewayAuthError when token is empty', async () => {
    await expect(adapter('').converse(simpleParams())).rejects.toThrow(AIGatewayAuthError);
  });

  it('throws generic Error on 500', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'Internal error' }, 500),
    );

    await expect(adapter().converse(simpleParams())).rejects.toThrow('AI gateway converse failed (500)');
  });

  it('error message never contains the token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'bad request' }, 400),
    );

    try {
      await adapter().converse(simpleParams());
    } catch (err) {
      expect((err as Error).message).not.toContain(TOKEN);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  invoke                                                             */
/* ------------------------------------------------------------------ */

describe('BedrockGatewayAdapter — invoke', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('passes body directly and uses default model', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ content: [{ type: 'text', text: 'Hello!' }] }),
    );

    const result = await adapter().invoke({
      body: {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 512,
        messages: [{ role: 'user', content: 'Hi' }],
      },
    });

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain('/invoke');
    expect(result).toHaveProperty('content');
  });
});

/* ------------------------------------------------------------------ */
/*  converseStream                                                     */
/* ------------------------------------------------------------------ */

describe('BedrockGatewayAdapter — converseStream', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses NDJSON stream events', async () => {
    const ndjson = [
      JSON.stringify({ contentBlockDelta: { delta: { text: 'Hello ' } } }),
      JSON.stringify({ contentBlockDelta: { delta: { text: 'world' } } }),
      JSON.stringify({ messageStop: { stopReason: 'end_turn' } }),
      JSON.stringify({ metadata: { usage: { inputTokens: 3, outputTokens: 5, totalTokens: 8 } } }),
    ].join('\n');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(ndjson, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } }),
    );

    const chunks: { textDelta?: string; stopReason?: string }[] = [];
    for await (const chunk of adapter().converseStream(simpleParams())) {
      chunks.push({ textDelta: chunk.textDelta, stopReason: chunk.stopReason });
    }

    expect(chunks[0].textDelta).toBe('Hello ');
    expect(chunks[1].textDelta).toBe('world');
    expect(chunks[2].stopReason).toBe('end_turn');
  });

  it('parses SSE format (data: prefix)', async () => {
    const sse = [
      'data: ' + JSON.stringify({ contentBlockDelta: { delta: { text: 'Hi' } } }),
      'data: ' + JSON.stringify({ messageStop: { stopReason: 'end_turn' } }),
    ].join('\n');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(sse, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
    );

    const chunks: string[] = [];
    for await (const chunk of adapter().converseStream(simpleParams())) {
      if (chunk.textDelta) chunks.push(chunk.textDelta);
    }

    expect(chunks[0]).toBe('Hi');
  });

  it('encodeURIComponent prevents modelId path injection', async () => {
    const maliciousModel = '../../admin/tokens';
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 }),
    );

    try {
      await adapter().converse(simpleParams({ modelId: maliciousModel }));
    } catch {
      // may fail to parse, that's fine
    }

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain(encodeURIComponent(maliciousModel));
    expect(url).not.toContain('../../');
  });
});
