import type { IAuthPort } from '../../ports/auth.port';
import type {
  CreateFormPayload,
  GabForm,
  IGabFormRepository,
  IGabPublicFormRepository,
  ListFormsQuery,
  PublicFormResolveResult,
  PublicFormSubmitResult,
  UpdateFormPayload,
} from '../../ports/form.repository';

function notSupported(): Promise<never> {
  return Promise.reject(new Error('Not supported when GAB_API_VERSION=v1'));
}

export class GabFormV1Adapter implements IGabFormRepository, IGabPublicFormRepository {
  constructor(
    private _authPort: IAuthPort,
    private _apiUrl: string,
  ) {}

  listForms(_appId: string, _query?: ListFormsQuery): Promise<{ items: GabForm[]; total: number }> {
    return notSupported();
  }

  getForm(_appId: string, _formId: string): Promise<GabForm> {
    return notSupported();
  }

  createForm(_appId: string, _payload: CreateFormPayload): Promise<GabForm> {
    return notSupported();
  }

  updateForm(_appId: string, _formId: string, _patch: UpdateFormPayload): Promise<GabForm> {
    return notSupported();
  }

  deleteForm(_appId: string, _formId: string): Promise<{ ok: boolean }> {
    return notSupported();
  }

  setDefaultForm(_appId: string, _formId: string): Promise<{ ok: boolean }> {
    return notSupported();
  }

  getDefaultForm(_appId: string, _tableId: string): Promise<GabForm> {
    return notSupported();
  }

  resolvePublicForm(_token: string): Promise<PublicFormResolveResult> {
    return notSupported();
  }

  submitPublicForm(
    _token: string,
    _bearerToken: string,
    _values: Record<string, unknown>,
  ): Promise<PublicFormSubmitResult> {
    return notSupported();
  }
}
