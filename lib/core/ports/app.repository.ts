/**
 * App (application) port — represents a GAB application instance.
 *
 * GAB Core gives every application its own PostgreSQL database. From the
 * frontend's perspective, an app is the top-level container for tables,
 * fields, relationships, forms, pages, workflows, and configuration.
 */

export interface GabApp {
  id: string;
  key: string;
  name: string;
  slug?: string;
  description?: string | null;
  companyId?: string;
  /** If set, this app is a sandbox of the referenced production app. */
  sandboxOf?: string | null;
  /** Whether the sandbox copied production data when it was created. */
  sandboxIncludeData?: boolean | null;
  /** When non-null, schema edits are blocked (sandbox-only mode). */
  schemaLockedAt?: string | null;
  /** IANA timezone, e.g. "America/New_York". Defaults set server-side. */
  timezone?: string;
  /** Sidebar navigation tree (opaque JSON, edited via Navigation Editor). */
  navigation?: unknown;
  tenantName?: string | null;
  tenantId?: string;
  createdAt?: string;
}

export interface CreateAppPayload {
  name: string;
  description?: string;
  companyId?: string;
  /** Tenant key/id used by GAB Core when the user is a super-admin. */
  tenantId?: string;
}

export interface UpdateAppPayload {
  name?: string;
  description?: string | null;
  timezone?: string;
  /** Opaque navigation tree — replaced wholesale on update. */
  navigation?: unknown;
}

export interface CopyAppPayload {
  name?: string;
  /** When true, copy production data along with schema. */
  includeData?: boolean;
}

// ---------------------------------------------------------------------------
// Complexity score (read-only insight surface)
// ---------------------------------------------------------------------------

export interface ComplexitySubScore {
  score: number;
  description: string;
  technical: string;
}

export interface ComplexityRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'schema' | 'computation' | 'topology' | 'volume' | 'amplification';
  title: string;
  description: string;
  technical: string;
  suggestion: string;
  impact: string;
  tableId?: string;
}

export interface ComplexityScore {
  overallScore: number;
  tier: 'Simple' | 'Moderate' | 'Complex' | 'Extreme';
  tierDescription: string;
  subscores: {
    schema: ComplexitySubScore;
    computation: ComplexitySubScore;
    graphTopology: ComplexitySubScore;
    dataVolume: ComplexitySubScore;
    writeAmplification: ComplexitySubScore;
  };
  recommendations: ComplexityRecommendation[];
  metrics: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Dependency graph (compute-engine DAG)
// ---------------------------------------------------------------------------

export interface DependencyGraphNode {
  fieldId: string;
  tableId: string;
  fieldName: string;
  fieldKey: string;
  /** e.g. 'formula' | 'lookup' | 'summary' | 'plain'. Adapter-passthrough. */
  dependencyType: string;
}

export interface DependencyGraphEdge {
  source: string;
  target: string;
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
  complexity: {
    score: number;
    level: 'low' | 'moderate' | 'high';
    depth: number;
    summaries: number;
    formulas: number;
    lookups: number;
    crossTableHops: number;
    totalNodes: number;
    edgeCount: number;
    clusters: number;
  };
}

export interface IGabAppRepository {
  /** List apps the current user can see. Optionally scoped by company/tenant. */
  listApps(companyId?: string): Promise<{ items: GabApp[]; total: number }>;
  /** Get a single app by base36 key or UUID. */
  getApp(appId: string): Promise<GabApp>;
  createApp(payload: CreateAppPayload): Promise<GabApp>;
  updateApp(appId: string, payload: UpdateAppPayload): Promise<GabApp>;
  /** Hard-delete (best-effort — V2 may soft-delete). */
  deleteApp(appId: string): Promise<{ ok: boolean }>;
  /** Copy schema (and optionally data) into a brand-new app. */
  copyApp(appId: string, payload: CopyAppPayload): Promise<GabApp>;
  /** Compute-engine complexity insight (cached server-side, ~5min). */
  getComplexityScore(appId: string): Promise<ComplexityScore>;
  /** Field dependency DAG used by the visualizer. */
  getDependencyGraph(appId: string): Promise<DependencyGraph>;
}
