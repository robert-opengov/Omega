/**
 * Template port — reusable app schemas that can be stamped into new apps.
 *
 * Templates have versions; subscribers track which version they applied so
 * `apply-update`, `rollback`, and `push-update` can compute three-way diffs.
 */

import type { SchemaDiff, SchemaChangeSelector } from './sandbox.repository';

export interface GabTemplate {
  id: string;
  name: string;
  description: string | null;
  status: string;
  sourceAppId: string | null;
  sourceAppKey: string | null;
  currentVersion: number;
  config: unknown;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GabTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  config: unknown;
  changelog: string | null;
  publishedBy: string | null;
  publishedAt: string;
}

export interface GabAppSubscription {
  id: string;
  appId: string;
  templateId: string | null;
  appliedVersion: number;
  updateStatus: string;
  appliedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  /** Schema config — typically copied from an exported app. */
  config: unknown;
}

export interface MaterializeTemplatePayload {
  appName: string;
  tenantId: string;
}

export interface ApplyTemplateUpdatePayload {
  /** Defaults to the latest version when omitted. */
  targetVersion?: number;
  /** Subset of changes to apply. Omit to apply everything. */
  selectedChanges?: SchemaChangeSelector[];
}

export interface ConflictSet {
  keys: string[];
  count: number;
}

export interface ThreeWayDiff {
  templateChanges: SchemaDiff;
  localChanges: SchemaDiff;
  conflicts: ConflictSet;
  migrationDiff: SchemaDiff;
}

export interface TemplateSubscriber {
  appId: string;
  appKey: string;
  appName: string;
  appliedVersion: number;
  updateStatus: string;
  appliedAt: string;
}

export interface IGabTemplateRepository {
  listTemplates(): Promise<{ items: GabTemplate[]; total: number }>;
  getTemplate(templateId: string): Promise<GabTemplate>;
  createTemplate(payload: CreateTemplatePayload): Promise<GabTemplate>;
  deleteTemplate(templateId: string): Promise<{ ok: boolean }>;
  /** Stamp a new app from a template. Server picks the latest version. */
  materialize(
    templateId: string,
    payload: MaterializeTemplatePayload,
  ): Promise<{ id: string; key: string; name: string }>;
  /** Promote the current schema as a new published version. */
  publish(
    templateId: string,
    payload: { changelog?: string },
  ): Promise<{ ok: boolean }>;
  listVersions(templateId: string): Promise<{ items: GabTemplateVersion[]; total: number }>;
  listSubscribers(templateId: string): Promise<{ items: TemplateSubscriber[]; total: number }>;
  /** Three-way diff between an app, its template, and the latest version. */
  getTemplateDiff(appId: string): Promise<ThreeWayDiff>;
  applyTemplateUpdate(
    appId: string,
    payload: ApplyTemplateUpdatePayload,
  ): Promise<GabAppSubscription>;
  rollbackTemplate(
    appId: string,
    targetVersion: number,
  ): Promise<GabAppSubscription>;
  /** Get an app's current template subscription (null when unsubscribed). */
  getAppSubscription(appId: string): Promise<GabAppSubscription | null>;
  /** Extract the current schema of an app into a new template draft. */
  extractFromApp(
    appId: string,
    payload: { templateName?: string },
  ): Promise<GabTemplate>;
}
