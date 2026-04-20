'use server';

import { z } from 'zod';
import { aiGatewayPort } from '@/lib/core';
import type { AIMessage } from '@/lib/core/ports/ai-gateway.port';
import {
  AIGatewayAuthError,
  AIGatewayQuotaError,
} from '@/lib/core/ports/ai-gateway.port';

/* ------------------------------------------------------------------ */
/*  Input validation schemas                                           */
/* ------------------------------------------------------------------ */

const textBlockSchema = z.object({ text: z.string() });

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.array(textBlockSchema).min(1),
});

const inferenceConfigSchema = z
  .object({
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(1).optional(),
    topP: z.number().min(0).max(1).optional(),
    stopSequences: z.array(z.string()).optional(),
  })
  .optional();

const toolSpecSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.object({ json: z.record(z.unknown()) }),
});

const toolConfigSchema = z
  .object({
    tools: z.array(z.object({ toolSpec: toolSpecSchema })),
    toolChoice: z.record(z.unknown()).optional(),
  })
  .optional();

const converseInputSchema = z.object({
  messages: z.array(messageSchema).min(1),
  systemPrompt: z.string().optional(),
  inferenceConfig: inferenceConfigSchema,
  toolConfig: toolConfigSchema,
  modelId: z.string().optional(),
});

const invokeInputSchema = z.object({
  body: z.record(z.unknown()),
  modelId: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  Result types                                                       */
/* ------------------------------------------------------------------ */

export type ConverseActionResult =
  | { success: true; text: string; message: AIMessage }
  | { success: false; error: string; code?: 'auth' | 'quota' | 'validation' };

export type InvokeActionResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string; code?: 'auth' | 'quota' | 'validation' };

/* ------------------------------------------------------------------ */
/*  converseAction                                                     */
/* ------------------------------------------------------------------ */

export async function converseAction(
  raw: z.input<typeof converseInputSchema>,
): Promise<ConverseActionResult> {
  const parsed = converseInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join('; '),
      code: 'validation',
    };
  }

  const input = parsed.data;

  try {
    const result = await aiGatewayPort.converse({
      modelId: input.modelId,
      messages: input.messages,
      system: input.systemPrompt ? [{ text: input.systemPrompt }] : undefined,
      inferenceConfig: input.inferenceConfig,
      toolConfig: input.toolConfig,
    });
    return { success: true, text: result.text, message: result.message };
  } catch (err) {
    return mapError(err);
  }
}

/* ------------------------------------------------------------------ */
/*  invokeAction                                                       */
/* ------------------------------------------------------------------ */

export async function invokeAction(
  raw: z.input<typeof invokeInputSchema>,
): Promise<InvokeActionResult> {
  const parsed = invokeInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join('; '),
      code: 'validation',
    };
  }

  const input = parsed.data;

  try {
    const data = await aiGatewayPort.invoke({
      modelId: input.modelId,
      body: input.body,
    });
    return { success: true, data };
  } catch (err) {
    return mapError(err);
  }
}

/* ------------------------------------------------------------------ */
/*  Error mapping — never leaks bearer or internal details             */
/* ------------------------------------------------------------------ */

function mapError(err: unknown): { success: false; error: string; code?: 'auth' | 'quota' } {
  if (err instanceof AIGatewayAuthError) {
    return { success: false, error: 'AI gateway authentication failed.', code: 'auth' };
  }
  if (err instanceof AIGatewayQuotaError) {
    return { success: false, error: 'AI gateway rate limit exceeded. Please try again later.', code: 'quota' };
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  return { success: false, error: message };
}
