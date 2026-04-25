/**
 * Workspace pages — layout JSON, routing slug, and builder metadata.
 * Aligns with GAB V2 `/v2/apps/:appId/pages` and `pages.schema.ts` shapes.
 */

export type DataBindingSource = 'table' | 'record' | 'query' | 'static';

export interface DataBinding {
  source: DataBindingSource;
  tableKey?: string;
  recordId?: string;
  filters?: Array<{
    field: string;
    op: string;
    value: unknown;
  }>;
  fields?: string[];
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PageComponent {
  id: string;
  type: string;
  colSpan?: number;
  colSpanMd?: number;
  colSpanSm?: number;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
  style?: Record<string, string | number | undefined>;
  children?: PageComponent[];
}

export interface PageRow {
  id: string;
  columns: number;
  columnsMd?: number;
  columnsSm?: number;
  gap?: number;
  components: PageComponent[];
}

export interface PageLayout {
  type: 'grid';
  rows: PageRow[];
}

export interface PageConfig {
  isHomePage?: boolean;
  requiresAuth?: boolean;
  parentPageKey?: string;
  fullScreen?: boolean;
  isPublic?: boolean;
  hideFromNav?: boolean;
  [key: string]: unknown;
}

export interface GabPage {
  id: string;
  key: string;
  name: string;
  slug: string;
  icon: string | null;
  /** Normalized to `{ type: 'grid', rows }` when possible */
  layout: PageLayout | Record<string, unknown>;
  config: PageConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePagePayload {
  name: string;
  slug: string;
  icon?: string;
  layout?: PageLayout;
  config?: PageConfig;
}

export type UpdatePagePayload = Partial<{
  name: string;
  slug: string;
  icon: string | null;
  layout: PageLayout;
  config: PageConfig;
}>;

export interface IGabPageRepository {
  listPages(appId: string): Promise<{ items: GabPage[]; total: number }>;
  getPage(appId: string, pageKey: string): Promise<GabPage>;
  createPage(appId: string, payload: CreatePagePayload): Promise<GabPage>;
  updatePage(
    appId: string,
    pageKey: string,
    patch: UpdatePagePayload,
  ): Promise<GabPage>;
  deletePage(appId: string, pageKey: string): Promise<{ ok: boolean }>;
  duplicatePage(appId: string, pageKey: string): Promise<GabPage>;
}
