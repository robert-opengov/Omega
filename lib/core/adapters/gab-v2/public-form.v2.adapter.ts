import type {
  IGabPublicFormRepository,
  PublicFormResolveResult,
  PublicFormSubmitResult,
} from '../../ports/form.repository';
import { normalizeForm, normalizePublicField } from './form.v2.adapter';

function getErrorMessage(payload: any, res: Response): string {
  if (payload?.message && typeof payload.message === 'string') return payload.message;
  if (payload?.error && typeof payload.error === 'string') return payload.error;
  return `GAB V2 ${res.status}: ${res.statusText}`;
}

async function parseJson(res: Response): Promise<any> {
  return res.json().catch(() => null);
}

export class GabPublicFormV2Adapter implements IGabPublicFormRepository {
  constructor(private readonly apiUrl: string) {}

  async resolvePublicForm(token: string): Promise<PublicFormResolveResult> {
    const res = await fetch(`${this.apiUrl}/v2/public/${token}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const payload = await parseJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(payload, res));
    }
    if (payload?.type !== 'form') {
      throw new Error('Public token does not resolve to a form.');
    }

    return {
      form: normalizeForm(payload.form),
      fields: Array.isArray(payload.fields) ? payload.fields.map(normalizePublicField) : [],
      settings:
        payload?.settings && typeof payload.settings === 'object'
          ? (payload.settings as Record<string, unknown>)
          : {},
      bearerToken: String(payload?.bearerToken ?? ''),
    };
  }

  async submitPublicForm(
    token: string,
    bearerToken: string,
    values: Record<string, unknown>,
  ): Promise<PublicFormSubmitResult> {
    const { __honeypot: _honeypot, ...sanitizedValues } = values;

    const res = await fetch(`${this.apiUrl}/v2/public/${token}/submit`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(sanitizedValues),
    });

    const payload = await parseJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(payload, res));
    }

    return {
      confirmationMessage: String(payload?.confirmationMessage ?? ''),
      redirectUrl:
        typeof payload?.redirectUrl === 'string' && payload.redirectUrl.length > 0
          ? payload.redirectUrl
          : undefined,
    };
  }
}
