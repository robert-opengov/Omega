import type { IAuthPort } from '../../ports/auth.port';
import type {
  IChildTableRepository,
  LoadRowsParams,
  PayloadColumn,
  RequestDatatable,
  SyncItem,
  SyncResponse,
  DatatableResponse,
  DropdownOption,
  ReportColumn,
  Relation,
} from '../../ports/child-table.repository';

/**
 * GAB V1 adapter for the child-table port.
 *
 * Every endpoint URL, query parameter name, and payload shape is matched
 * 1-to-1 against the Angular ChildTableDataService (the production source
 * of truth confirmed via GABSW-1989).
 */
export class GabChildTableV1Adapter implements IChildTableRepository {
  constructor(
    private readonly auth: IAuthPort,
    private readonly apiUrl: string,
  ) {}

  // -----------------------------------------------------------------------
  // Auth-aware fetch
  // -----------------------------------------------------------------------

  private async fetchWithAuth<T>(
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await this.auth.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...init, headers });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `API ${init.method ?? 'GET'} ${url} failed (${res.status}): ${body}`,
      );
    }

    return res.json() as Promise<T>;
  }

  private async fetchSafe<T>(
    url: string,
    fallback: T,
    init: RequestInit = {},
  ): Promise<T> {
    try {
      return await this.fetchWithAuth<T>(url, init);
    } catch {
      return fallback;
    }
  }

  // -----------------------------------------------------------------------
  // Data Loading — POST /api/report/getdatatabledata
  // -----------------------------------------------------------------------

  async loadRows(params: LoadRowsParams): Promise<DatatableResponse> {
    const payload: RequestDatatable = {
      TableKey: params.tableKey,
      ReportKey: params.reportKey,
      Draw: params.draw ?? 1,
      Start: params.start ?? 0,
      Length: params.length ?? 50,
      Order: [
        { column: params.orderColumn ?? -1, dir: params.orderDir ?? 'asc' },
      ],
      Columns: params.columns ?? [],
      Search: { value: params.searchValue ?? '', regex: false },
      IsGroupingEnabled: false,
      IsQueryReport: false,
      GetAll: false,
      FromDashboard: false,
      FromEmbeddedReport: false,
      Template: [],
      ConditionGroups: null,
    };

    if (params.isEmbedded) {
      payload.IsEmbeddedReport = true;
      payload.LookupFieldValue = params.lookupFieldValue ?? '';
      payload.ReferenceFieldKey = params.referenceFieldKey ?? '';
    }

    return this.fetchWithAuth<DatatableResponse>(
      `${this.apiUrl}/api/report/getdatatabledata`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
  }

  // -----------------------------------------------------------------------
  // CRUD — POST /api/formaction/syncdata
  // -----------------------------------------------------------------------

  async syncChanges(items: SyncItem[]): Promise<SyncResponse> {
    return this.fetchWithAuth<SyncResponse>(
      `${this.apiUrl}/api/formaction/syncdata`,
      { method: 'POST', body: JSON.stringify(items) },
    );
  }

  // -----------------------------------------------------------------------
  // CRUD — POST /api/formaction/postdata
  // -----------------------------------------------------------------------

  async insertRow(
    tableKey: string,
    applicationKey: string,
    fields: Array<{
      Key: string;
      Value: string;
      Base64EncodedFile?: string | null;
      Type?: string;
    }>,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      `${this.apiUrl}/api/formaction/postdata`,
      {
        method: 'POST',
        body: JSON.stringify({
          ApplicationTableKey: tableKey,
          ApplicationKey: applicationKey,
          fieldsList: fields.map((f) => ({
            Name: f.Key,
            Value: String(f.Value),
            Base64EncodedFile: f.Base64EncodedFile ?? null,
          })),
        }),
      },
    );
  }

  // -----------------------------------------------------------------------
  // CRUD — PUT /api/formaction/putdata
  // -----------------------------------------------------------------------

  async updateCell(
    tableKey: string,
    applicationKey: string,
    rid: number,
    fields: Array<{
      Key: string;
      Value: string;
      Base64EncodedFile?: string | null;
      Type?: string;
    }>,
  ): Promise<unknown> {
    return this.fetchWithAuth(
      `${this.apiUrl}/api/formaction/putdata`,
      {
        method: 'PUT',
        body: JSON.stringify({
          ApplicationTableKey: tableKey,
          ApplicationKey: applicationKey,
          fieldsList: fields.map((f) => ({
            Name: f.Key,
            Value: String(f.Value),
            Base64EncodedFile: f.Base64EncodedFile ?? null,
          })),
          Where: { Rid: rid },
        }),
      },
    );
  }

  // -----------------------------------------------------------------------
  // CRUD — DELETE /api/formaction/deleteobject
  // -----------------------------------------------------------------------

  async deleteRows(tableKey: string, rids: number[]): Promise<unknown> {
    const isBulk = rids.length > 1;
    const body = {
      ApplicationTableKey: tableKey,
      IsBulkUpdateDelete: isBulk,
      Where: isBulk ? { Rids: rids } : { Rid: rids[0] },
    };
    return this.fetchWithAuth(
      `${this.apiUrl}/api/formaction/deleteobject`,
      { method: 'DELETE', body: JSON.stringify(body) },
    );
  }

  // -----------------------------------------------------------------------
  // Relationship Discovery — GET /api/relation/getbytableid?Id={tableId}
  // -----------------------------------------------------------------------

  async getRelations(parentTableKey: string): Promise<Relation[]> {
    return this.fetchWithAuth<Relation[]>(
      `${this.apiUrl}/api/relation/getbytableid?Id=${e(parentTableKey)}`,
    );
  }

  async findChildRelation(
    parentTableKey: string,
    childTableKey: string,
  ): Promise<Relation | null> {
    const relations = await this.getRelations(parentTableKey);
    return (
      relations.find(
        (r) =>
          r.RelationType === 'Has many' &&
          r.ApplicationTableKey === childTableKey,
      ) ?? null
    );
  }

  // -----------------------------------------------------------------------
  // Report/Field Metadata
  // -----------------------------------------------------------------------

  async getReports(tableKey: string): Promise<unknown[]> {
    return this.fetchWithAuth<unknown[]>(
      `${this.apiUrl}/api/report/getreportbytableid?id=${e(tableKey)}&inForms=false&formType=&fromTableSettings=false`,
    );
  }

  async getTableFields(tableKey: string): Promise<ReportColumn[]> {
    return this.fetchWithAuth<ReportColumn[]>(
      `${this.apiUrl}/api/report/gettablefields?id=${e(tableKey)}`,
    );
  }

  async getReportColumns(
    reportKey: string,
    tableKey: string,
  ): Promise<ReportColumn[]> {
    return this.fetchWithAuth<ReportColumn[]>(
      `${this.apiUrl}/api/report/getreportcolumns?id=${e(reportKey)}&tableId=${e(tableKey)}&fromDashboard=false`,
    );
  }

  async getReportById(
    reportKey: string,
    tableKey: string,
  ): Promise<unknown> {
    return this.fetchSafe(
      `${this.apiUrl}/api/report/getreportbyid?id=${e(reportKey)}&tableId=${e(tableKey)}`,
      null,
    );
  }

  // -----------------------------------------------------------------------
  // Dropdown & User Options
  // -----------------------------------------------------------------------

  async fetchDropdownValues(fieldKey: string): Promise<DropdownOption[]> {
    return this.fetchSafe<DropdownOption[]>(
      `${this.apiUrl}/api/Field/getdropdownvalues?id=${e(fieldKey)}`,
      [],
    );
  }

  async fetchAllDropdownValues(
    fieldKeys: string[],
  ): Promise<Record<string, DropdownOption[]>> {
    if (fieldKeys.length === 0) return {};
    const entries = await Promise.all(
      fieldKeys.map(async (key) => {
        const options = await this.fetchDropdownValues(key);
        return [key, options] as const;
      }),
    );
    return Object.fromEntries(entries);
  }

  async fetchUsers(
    tableKey: string,
    applicationId: string,
  ): Promise<DropdownOption[]> {
    const params = [
      `tableId=${e(tableKey)}`,
      `applicationId=${e(applicationId)}`,
      'isSearch=false',
      'search=',
      'isScroll=false',
      'skip=0',
      'pageSize=0',
      'isConditionComponent=false',
    ].join('&');
    return this.fetchSafe<DropdownOption[]>(
      `${this.apiUrl}/api/Form/formfieldusers?${params}`,
      [],
    );
  }

  // -----------------------------------------------------------------------
  // Form & Rule Metadata
  // -----------------------------------------------------------------------

  async fetchForms(
    tableKey: string,
  ): Promise<Array<{ Key: string; Name: string; Type?: string }>> {
    return this.fetchSafe(
      `${this.apiUrl}/api/Form/getbytableid?Id=${e(tableKey)}&inReport=false`,
      [],
    );
  }

  async fetchFormRules(
    formKey: string,
    tableKey: string,
  ): Promise<unknown[]> {
    return this.fetchSafe<unknown[]>(
      `${this.apiUrl}/api/Form/getFormRules?id=${e(formKey)}&tableId=${e(tableKey)}`,
      [],
    );
  }

  async fetchFormSavedFields(
    formKey: string,
    tableKey: string,
    parentTableKey: string = '0',
  ): Promise<unknown> {
    return this.fetchSafe(
      `${this.apiUrl}/api/Form/getformsavedfields?id=${e(formKey)}&tableId=${e(tableKey)}&viewRecord=true&defaultForm=true&fromEmbeddedOrDrilldown=true&parentTableId=${e(parentTableKey)}`,
      null,
    );
  }

  // -----------------------------------------------------------------------
  // Discovery convenience
  // -----------------------------------------------------------------------

  async discoverTable(tableKey: string): Promise<{
    reports: unknown[];
    fields: ReportColumn[];
    defaultReportKey: string | null;
  }> {
    const [reports, fields] = await Promise.all([
      this.getReports(tableKey),
      this.getTableFields(tableKey),
    ]);
    const defaultReport =
      (reports as Array<Record<string, unknown>>).find(
        (r) => r['DefaultReport'] === 1,
      ) ??
      (reports[0] as Record<string, unknown> | undefined) ??
      null;
    return {
      reports,
      fields,
      defaultReportKey: defaultReport
        ? ((defaultReport['Key'] as string) ?? null)
        : null,
    };
  }

  // -----------------------------------------------------------------------
  // Column building — matches Angular buildPayloadColumns exactly
  // -----------------------------------------------------------------------

  buildPayloadColumns(fields: ReportColumn[]): PayloadColumn[] {
    const cols: PayloadColumn[] = fields.map((f) => ({
      data: f.FieldName,
      name: '',
      searchable: true,
      orderable: true,
      search: { value: '', regex: false },
    }));
    cols.push({
      data: '',
      name: '',
      searchable: true,
      orderable: true,
      search: { value: '', regex: false },
    });
    return cols;
  }
}

function e(value: string): string {
  return encodeURIComponent(value);
}
