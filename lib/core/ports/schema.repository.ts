export interface CreateAppParams {
  name: string;
  companyKey: string;
  /** Optional key. If omitted, the backend generates one. */
  key?: string;
}

export interface CreateTableParams {
  name: string;
  applicationKey: string;
  icon?: string;
  /** Defaults to true in the backend. If true, a default form and report are created. */
  createReportAndForm?: boolean;
}

export interface CreateFieldParams {
  applicationKey: string;
  applicationTableKey: string;
  name: string;
  fieldType: string;
  isUnique?: boolean;
  isNullable?: boolean;
}

export interface CreateRelationParams {
  applicationKey: string;
  /** The source table key */
  applicationTableKey: string;
  /** The target table key */
  applicationTable2Key: string;
  /** e.g. "1:N", "1:1", "N:M" */
  relationType: string;
  customRelation?: string;
}

export interface CreateFormParams {
  applicationKey: string;
  name: string;
  applicationTableKey: string;
  /** e.g., "web", "mobile", "pdf", "word" */
  type: string;
  defaultForm?: boolean;
}

export interface CreateReportParams {
  applicationKey: string;
  name: string;
  applicationTableKey: string;
  /** Must be an array, max length 25. If omitted, adapter should pass an empty array. */
  columns?: any[];
  /** Must be an array. If omitted, adapter should pass an empty array. */
  filters?: any[];
  defaultReport?: boolean;
}

export interface IGabSchemaRepository {
  createApp(params: CreateAppParams): Promise<any>;
  createTable(params: CreateTableParams): Promise<any>;
  createField(params: CreateFieldParams): Promise<any>;
  createRelation(params: CreateRelationParams): Promise<any>;
  createForm(params: CreateFormParams): Promise<any>;
  createReport(params: CreateReportParams): Promise<any>;
  createWorkflow(params: any): Promise<any>;
}
