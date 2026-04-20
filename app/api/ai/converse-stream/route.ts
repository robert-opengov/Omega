import { z } from 'zod';
import { aiGatewayPort } from '@/lib/core';
import type { ConverseParams } from '@/lib/core/ports/ai-gateway.port';
import {
  AIGatewayAuthError,
  AIGatewayQuotaError,
} from '@/lib/core/ports/ai-gateway.port';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Input validation (same shapes as the server action)                */
/* ------------------------------------------------------------------ */

const textBlockSchema = z.object({ text: z.string() });
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.array(textBlockSchema).min(1),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1),
  system: z.array(z.object({ text: z.string() })).optional(),
  inferenceConfig: z
    .object({
      maxTokens: z.number().int().positive().optional(),
      temperature: z.number().min(0).max(1).optional(),
      topP: z.number().min(0).max(1).optional(),
      stopSequences: z.array(z.string()).optional(),
    })
    .optional(),
  toolConfig: z
    .object({
      tools: z.array(
        z.object({
          toolSpec: z.object({
            name: z.string(),
            description: z.string().optional(),
            inputSchema: z.object({ json: z.record(z.unknown()) }),
          }),
        }),
      ),
      toolChoice: z.record(z.unknown()).optional(),
    })
    .optional(),
  modelId: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  POST handler — proxy upstream byte stream to the browser           */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  let params: ConverseParams;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues.map((i) => i.message).join('; ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    params = parsed.data;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const upstream = await aiGatewayPort.converseStreamRaw(params);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('Content-Type') ?? 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    if (err instanceof AIGatewayAuthError) {
      return new Response(
        JSON.stringify({ error: 'AI gateway authentication failed.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (err instanceof AIGatewayQuotaError) {
      return new Response(
        JSON.stringify({ error: 'AI gateway rate limit exceeded.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
