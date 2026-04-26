'use server';

/**
 * Generate-code server action — invoked from the AiCodeDialog inside the
 * page editor's PropertiesPanel (`pageBuilder.codeProp`).
 *
 * Wraps the existing `aiGatewayPort.converse()` with a focused system
 * prompt, so the AI always returns a single fenced code block in the
 * requested language. The dialog extracts the code from the response.
 *
 * Removal recipe: flip `pageBuilder.codeProp` off OR delete this file +
 * lib/page-builder/page-component-registry.ts's `'code'` editor branch.
 */

import { z } from 'zod';
import { aiGatewayPort } from '@/lib/core';
import { assertModuleEnabled } from '@/lib/feature-guards';

const inputSchema = z.object({
  prompt: z.string().min(1),
  language: z.enum([
    'javascript',
    'typescript',
    'tsx',
    'jsx',
    'css',
    'html',
    'json',
  ]).default('javascript'),
  /** Existing source the user wants to refine. Surfaces in the system prompt. */
  existing: z.string().optional(),
  /** Optional context summary (e.g. "this is a button onClick handler"). */
  context: z.string().optional(),
});

export interface GenerateCodeResult {
  success: boolean;
  code?: string;
  error?: string;
}

const FENCE_RE = /```(?:[a-zA-Z]+)?\n([\s\S]*?)```/;

function extractCode(text: string): string {
  const m = FENCE_RE.exec(text);
  return (m ? m[1] : text).trim();
}

export async function generateCodeAction(
  raw: z.input<typeof inputSchema>,
): Promise<GenerateCodeResult> {
  await assertModuleEnabled('pageBuilder.codeProp');

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Bad input' };
  }
  const { prompt, language, existing, context } = parsed.data;

  const systemSegments = [
    `You are a senior engineer writing ${language} code.`,
    'Reply with ONE fenced code block and nothing else.',
    'Do not add commentary, examples, or alternatives.',
    'Keep the answer self-contained and ready to paste into a code editor.',
  ];
  if (context) systemSegments.push(`Context: ${context}.`);

  const userSegments: string[] = [];
  if (existing) {
    userSegments.push(
      `Refine this existing ${language}:\n\`\`\`${language}\n${existing}\n\`\`\``,
    );
  }
  userSegments.push(prompt);

  try {
    const res = await aiGatewayPort.converse({
      system: [{ text: systemSegments.join(' ') }],
      messages: [
        {
          role: 'user',
          content: [{ text: userSegments.join('\n\n') }],
        },
      ],
      inferenceConfig: { temperature: 0.2, maxTokens: 1500 },
    });
    return { success: true, code: extractCode(res.text) };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'AI gateway call failed.';
    console.error('generateCodeAction error:', message);
    return { success: false, error: message };
  }
}
