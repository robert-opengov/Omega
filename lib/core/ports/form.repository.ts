export type FormLayoutItemType =
  | 'field'
  | 'header'
  | 'divider'
  | 'text'
  | 'button'
  | 'button-group'
  | 'child-grid'
  | 'child-section'
  | 'widget';

export type FormDisplayMode = 'stacked' | 'tabs' | 'wizard';

export interface ValidationRule {
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'expression';
  value?: number | string;
  expression?: string;
  message: string;
}

export type ButtonAction =
  | { type: 'save' }
  | { type: 'save-and-close' }
  | { type: 'save-and-new' }
  | { type: 'navigate'; url: string }
  | { type: 'trigger-workflow'; workflowId: string }
  | { type: 'set-field'; field: string; value: unknown }
  | { type: 'custom'; expression: string };

export interface ButtonConfig {
  label: string;
  variant: 'contained' | 'outlined' | 'text';
  color: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
  icon?: string;
  action: ButtonAction;
}

export interface ChildTableConfig {
  tableId: string;
  referenceFieldId: string;
  displayMode: 'grid' | 'cards';
  columns?: string[];
  maxRows?: number;
  minRows?: number;
  addLabel?: string;
}

interface BaseLayoutItem {
  id: string;
  type: FormLayoutItemType;
  colSpan?: number;
  visibleIf?: string;
  requiredIf?: string;
  readOnlyIf?: string;
}

export interface FieldLayoutItem extends BaseLayoutItem {
  type: 'field';
  fieldId: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}

export interface HeaderLayoutItem extends BaseLayoutItem {
  type: 'header';
  text?: string;
}

export interface DividerLayoutItem extends BaseLayoutItem {
  type: 'divider';
  text?: string;
}

export interface TextLayoutItem extends BaseLayoutItem {
  type: 'text';
  text?: string;
}

export interface ButtonLayoutItem extends BaseLayoutItem {
  type: 'button';
  buttonConfig?: ButtonConfig;
}

export interface ButtonGroupLayoutItem extends BaseLayoutItem {
  type: 'button-group';
  buttons?: ButtonConfig[];
}

export interface ChildGridLayoutItem extends BaseLayoutItem {
  type: 'child-grid';
  childConfig?: ChildTableConfig;
}

export interface ChildSectionLayoutItem extends BaseLayoutItem {
  type: 'child-section';
  childConfig?: ChildTableConfig;
}

export interface WidgetLayoutItem extends BaseLayoutItem {
  type: 'widget';
  widgetCode?: string;
  widgetLabel?: string;
  widgetMinHeight?: number;
}

export type FormLayoutItem =
  | FieldLayoutItem
  | HeaderLayoutItem
  | DividerLayoutItem
  | TextLayoutItem
  | ButtonLayoutItem
  | ButtonGroupLayoutItem
  | ChildGridLayoutItem
  | ChildSectionLayoutItem
  | WidgetLayoutItem;

export interface FormRule {
  id: string;
  type: 'visibility' | 'required' | 'readOnly' | 'setValue' | 'validation';
  targetItemId: string;
  expression: string;
  valueExpression?: string;
  errorMessage?: string;
}

export interface FormLayoutSection {
  id: string;
  title?: string;
  description?: string;
  displayMode?: FormDisplayMode;
  columns?: 1 | 2 | 3;
  items: FormLayoutItem[];
  icon?: string;
}

export interface FormLayout {
  sections: FormLayoutSection[];
  displayMode?: FormDisplayMode;
  rules?: FormRule[];
  submitButton?: ButtonConfig | false;
  cancelButton?: ButtonConfig | false;
}

export type FormConfig = Record<string, unknown>;

export interface GabForm {
  id: string;
  key: string;
  name: string;
  tableId?: string | null;
  description?: string | null;
  config: FormConfig;
  layout: FormLayout;
  isDefault: boolean;
  createdAt: string;
}

export interface ListFormsQuery {
  tableId?: string;
}

export interface CreateFormPayload {
  name: string;
  tableId?: string;
  description?: string;
  layout?: FormLayout;
  config?: FormConfig;
  isDefault?: boolean;
}

export type UpdateFormPayload = Partial<CreateFormPayload>;

export interface PublicFormField {
  id: string;
  key: string;
  name: string;
  type: string;
  required: boolean;
  config: Record<string, unknown> | null;
  defaultValue: string | null;
}

export interface PublicFormSettings {
  [key: string]: unknown;
}

export interface PublicFormResolveResult {
  form: GabForm;
  fields: PublicFormField[];
  settings: PublicFormSettings;
  bearerToken: string;
}

export interface PublicFormSubmitResult {
  confirmationMessage: string;
  redirectUrl?: string;
}

export interface IGabFormRepository {
  listForms(appId: string, query?: ListFormsQuery): Promise<{ items: GabForm[]; total: number }>;
  getForm(appId: string, formId: string): Promise<GabForm>;
  createForm(appId: string, payload: CreateFormPayload): Promise<GabForm>;
  updateForm(appId: string, formId: string, patch: UpdateFormPayload): Promise<GabForm>;
  deleteForm(appId: string, formId: string): Promise<{ ok: boolean }>;
  setDefaultForm(appId: string, formId: string): Promise<{ ok: boolean }>;
  getDefaultForm(appId: string, tableId: string): Promise<GabForm>;
}

export interface IGabPublicFormRepository {
  resolvePublicForm(token: string): Promise<PublicFormResolveResult>;
  submitPublicForm(
    token: string,
    bearerToken: string,
    values: Record<string, unknown>,
  ): Promise<PublicFormSubmitResult>;
}
