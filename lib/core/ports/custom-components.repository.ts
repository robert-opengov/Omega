/**
 * Per-app custom React components stored in GAB and referenced from page layout.
 */

export type ComponentVisibility = 'personal' | 'app';

export interface GabCustomComponent {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  code: string;
  propsSchema: unknown;
  defaultProps: unknown;
  dataBindingSupported: boolean;
  createdBy: string | null;
  visibility: ComponentVisibility;
  version: number;
  codeHistory: unknown;
  sourcePageKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomComponentPayload {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  propsSchema?: unknown;
  defaultProps?: unknown;
  dataBindingSupported?: boolean;
  visibility?: ComponentVisibility;
  sourcePageKey?: string;
}

export type UpdateCustomComponentPayload = Partial<{
  name: string;
  description: string;
  icon: string;
  code: string;
  propsSchema: unknown;
  defaultProps: unknown;
  dataBindingSupported: boolean;
  visibility: ComponentVisibility;
}>;

export interface CustomComponentUsage {
  pages: Array<{ key: string; name: string }>;
  total: number;
}

export interface IGabCustomComponentRepository {
  listComponents(appId: string): Promise<{ items: GabCustomComponent[]; total: number }>;
  getComponent(appId: string, key: string): Promise<GabCustomComponent>;
  createComponent(
    appId: string,
    payload: CreateCustomComponentPayload,
  ): Promise<GabCustomComponent>;
  updateComponent(
    appId: string,
    key: string,
    patch: UpdateCustomComponentPayload,
  ): Promise<GabCustomComponent>;
  deleteComponent(appId: string, key: string): Promise<{ ok: boolean }>;
  duplicateComponent(appId: string, key: string): Promise<GabCustomComponent>;
  getUsage(appId: string, key: string): Promise<CustomComponentUsage>;
  rollbackComponent(
    appId: string,
    key: string,
    version: number,
  ): Promise<GabCustomComponent>;
  shareComponent(appId: string, key: string): Promise<GabCustomComponent>;
}
