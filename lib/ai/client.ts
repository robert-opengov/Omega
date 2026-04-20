'use client';

import {
  converseAction,
  invokeAction,
  type ConverseActionResult,
} from '@/app/actions/ai/converse';
import type {
  AIMessage,
  AIInferenceConfig,
  AIToolConfig,
} from '@/lib/core/ports/ai-gateway.port';

/* ------------------------------------------------------------------ */
/*  Shared options                                                     */
/* ------------------------------------------------------------------ */

export interface AskOptions {
  /** Override the default model (e.g. "us.anthropic.claude-sonnet-4-20250514"). */
  modelId?: string;
  /** System prompt prepended to the conversation. */
  systemPrompt?: string;
  /** Bedrock inference config (maxTokens, temperature, etc.). */
  inferenceConfig?: AIInferenceConfig;
  /** Tool definitions for function-calling. */
  toolConfig?: AIToolConfig;
}

/* ------------------------------------------------------------------ */
/*  ask — one-shot single-message, returns text                        */
/* ------------------------------------------------------------------ */

export async function ask(
  prompt: string,
  opts: AskOptions = {},
): Promise<string> {
  const res = await converseAction({
    messages: [{ role: 'user', content: [{ text: prompt }] }],
    systemPrompt: opts.systemPrompt,
    inferenceConfig: opts.inferenceConfig,
    toolConfig: opts.toolConfig,
    modelId: opts.modelId,
  });
  if (!res.success) throw new Error(res.error);
  return res.text;
}

/* ------------------------------------------------------------------ */
/*  chat — multi-turn, returns full result                             */
/* ------------------------------------------------------------------ */

export async function chat(
  messages: AIMessage[],
  opts: AskOptions = {},
): Promise<ConverseActionResult> {
  return converseAction({
    messages,
    systemPrompt: opts.systemPrompt,
    inferenceConfig: opts.inferenceConfig,
    toolConfig: opts.toolConfig,
    modelId: opts.modelId,
  });
}

/* ------------------------------------------------------------------ */
/*  askStream — streaming, calls onDelta per text fragment             */
/* ------------------------------------------------------------------ */

export interface StreamOptions extends AskOptions {
  /** AbortSignal for cancellation (e.g. from an AbortController). */
  signal?: AbortSignal;
}

export async function askStream(
  prompt: string,
  onDelta: (chunk: string) => void,
  opts: StreamOptions = {},
): Promise<string> {
  return chatStream(
    [{ role: 'user', content: [{ text: prompt }] }],
    onDelta,
    opts,
  );
}

/* ------------------------------------------------------------------ */
/*  chatStream — streaming multi-turn                                  */
/* ------------------------------------------------------------------ */

export async function chatStream(
  messages: AIMessage[],
  onDelta: (chunk: string) => void,
  opts: StreamOptions = {},
): Promise<string> {
  const body = {
    messages,
    ...(opts.modelId ? { modelId: opts.modelId } : {}),
    ...(opts.systemPrompt
      ? { system: [{ text: opts.systemPrompt }] }
      : {}),
    ...(opts.inferenceConfig
      ? { inferenceConfig: opts.inferenceConfig }
      : {}),
    ...(opts.toolConfig ? { toolConfig: opts.toolConfig } : {}),
  };

  const res = await fetch('/api/ai/converse-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      `Stream failed (${res.status}): ${errBody || 'No response body'}`,
    );
  }

  return readStreamDeltas(res.body, onDelta);
}

/* ------------------------------------------------------------------ */
/*  invoke — raw Bedrock-shape escape hatch                            */
/* ------------------------------------------------------------------ */

export async function invoke(
  body: Record<string, unknown>,
  modelId?: string,
): Promise<Record<string, unknown>> {
  const res = await invokeAction({ body, modelId });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

async function readStreamDeltas(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

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
        const delta = extractDelta(line);
        if (delta) { onDelta(delta); full += delta; }
      }
    }
    if (buffer.trim()) {
      const delta = extractDelta(buffer.trim());
      if (delta) { onDelta(delta); full += delta; }
    }
  } finally {
    reader.releaseLock();
  }

  return full;
}

/** Parse a line as NDJSON or SSE and extract contentBlockDelta text. */
function extractDelta(line: string): string | undefined {
  let json = line;
  if (json.startsWith('data:')) {
    json = json.slice(5).trim();
  }
  if (!json || json === '[DONE]') return undefined;
  try {
    const evt = JSON.parse(json);
    return evt?.contentBlockDelta?.delta?.text as string | undefined;
  } catch {
    return undefined;
  }
}
