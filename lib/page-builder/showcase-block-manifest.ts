/**
 * Page builder palette — derived from the same @/components/ui inventory as the UI Showcase.
 * Each `id` maps to a renderer in `components/_custom/page-builder/render/blocks-registry.tsx`.
 *
 * Excluded: app-chrome components (Sidebar, Navbar, AuthForm) and other non-canvas parts.
 */

export type BlockTier = 'atom' | 'molecule' | 'organism';

export type BlockCategory = 'content' | 'form' | 'data' | 'layout' | 'media' | 'charts' | 'navigation';

export interface ShowcaseBlockManifestEntry {
  id: string;
  label: string;
  tier: BlockTier;
  category: BlockCategory;
  /** Default props for new instances (merged in editor) */
  defaultProps: Record<string, unknown>;
}

/** Palette groups mirror Showcase tiers with practical canvas defaults */
export const SHOWCASE_BLOCK_MANIFEST: ShowcaseBlockManifestEntry[] = [
  // —— Atoms (content / form) ——
  { id: 'atom_button', label: 'Button', tier: 'atom', category: 'content', defaultProps: { children: 'Button' } },
  { id: 'atom_badge', label: 'Badge', tier: 'atom', category: 'content', defaultProps: { children: 'Label' } },
  { id: 'atom_heading', label: 'Heading', tier: 'atom', category: 'content', defaultProps: { children: 'Section title' } },
  { id: 'atom_text', label: 'Text', tier: 'atom', category: 'content', defaultProps: { children: 'Body text' } },
  { id: 'atom_code', label: 'Code', tier: 'atom', category: 'content', defaultProps: { children: 'key' } },
  { id: 'atom_input', label: 'Input', tier: 'atom', category: 'form', defaultProps: { placeholder: 'Type…' } },
  { id: 'atom_textarea', label: 'Textarea', tier: 'atom', category: 'form', defaultProps: { placeholder: '…' } },
  { id: 'atom_select', label: 'Select', tier: 'atom', category: 'form', defaultProps: { placeholder: 'Select' } },
  { id: 'atom_checkbox', label: 'Checkbox', tier: 'atom', category: 'form', defaultProps: { label: 'Option' } },
  { id: 'atom_switch', label: 'Switch', tier: 'atom', category: 'form', defaultProps: { label: 'Enable' } },
  { id: 'atom_chip', label: 'Chip', tier: 'atom', category: 'content', defaultProps: { children: 'Tag' } },
  { id: 'atom_uilink', label: 'Link', tier: 'atom', category: 'navigation', defaultProps: { children: 'Link', href: '#' } },
  { id: 'atom_separator', label: 'Separator', tier: 'atom', category: 'layout', defaultProps: {} },
  { id: 'atom_spinner', label: 'Spinner', tier: 'atom', category: 'content', defaultProps: {} },
  { id: 'atom_progress', label: 'Progress', tier: 'atom', category: 'content', defaultProps: { value: 50 } },
  { id: 'atom_avatar', label: 'Avatar', tier: 'atom', category: 'media', defaultProps: { fallback: 'A' } },

  // —— Molecules ——
  { id: 'mol_card', label: 'Card', tier: 'molecule', category: 'layout', defaultProps: { title: 'Card' } },
  { id: 'mol_alert', label: 'Alert', tier: 'molecule', category: 'content', defaultProps: { title: 'Notice' } },
  { id: 'mol_hero', label: 'Hero', tier: 'molecule', category: 'content', defaultProps: { title: 'Hero' } },
  { id: 'mol_empty_state', label: 'Empty state', tier: 'molecule', category: 'content', defaultProps: { title: 'No data' } },
  { id: 'mol_tabs', label: 'Tabs', tier: 'molecule', category: 'layout', defaultProps: { tabLabels: 'One, Two' } },
  { id: 'mol_breadcrumbs', label: 'Breadcrumbs', tier: 'molecule', category: 'navigation', defaultProps: { items: 'Home, Here' } },
  { id: 'mol_page_header', label: 'Page header', tier: 'molecule', category: 'layout', defaultProps: { title: 'Page' } },
  { id: 'mol_metric_card', label: 'Metric card', tier: 'molecule', category: 'data', defaultProps: { label: 'KPI' } },
  { id: 'mol_banner', label: 'Banner', tier: 'molecule', category: 'content', defaultProps: { children: 'Banner' } },
  { id: 'mol_pagination', label: 'Pagination', tier: 'molecule', category: 'navigation', defaultProps: { page: 1, pageCount: 1 } },
  { id: 'mol_accordion', label: 'Accordion', tier: 'molecule', category: 'layout', defaultProps: { itemTitle: 'Section' } },
  { id: 'mol_label_value', label: 'Label / value', tier: 'molecule', category: 'data', defaultProps: { label: 'Field', value: '—' } },

  // —— Organisms (data / charts — many need app + table in props at runtime) ——
  { id: 'org_chart_card', label: 'Chart card', tier: 'organism', category: 'charts', defaultProps: { title: 'Chart' } },
  { id: 'org_timeline', label: 'Timeline', tier: 'organism', category: 'data', defaultProps: {} },
  { id: 'org_gantt', label: 'Gantt', tier: 'organism', category: 'charts', defaultProps: {} },
  { id: 'org_location_map', label: 'Map', tier: 'organism', category: 'data', defaultProps: {} },
  { id: 'org_kanban', label: 'Kanban', tier: 'organism', category: 'data', defaultProps: {} },
  { id: 'org_widget_grid', label: 'Widget grid', tier: 'organism', category: 'layout', defaultProps: { columns: 2 } },
  { id: 'org_filter_builder', label: 'Filter builder', tier: 'organism', category: 'form', defaultProps: {} },
  { id: 'org_footer', label: 'Footer', tier: 'organism', category: 'layout', defaultProps: {} },
  { id: 'org_detail_header', label: 'Detail header', tier: 'organism', category: 'layout', defaultProps: { title: 'Record' } },
  { id: 'org_dynamic_form', label: 'Dynamic form', tier: 'organism', category: 'form', defaultProps: {} },
  { id: 'org_data_grid', label: 'Data grid', tier: 'organism', category: 'data', defaultProps: { title: 'Records' } },
  { id: 'org_ai_disclaimer', label: 'AI disclaimer', tier: 'organism', category: 'content', defaultProps: {} },

  // —— GAB-style primitives (not separate UI exports — composed from atoms) ——
  { id: 'pb_text_block', label: 'Text block', tier: 'molecule', category: 'content', defaultProps: { content: 'Edit me' } },
  { id: 'pb_spacer', label: 'Spacer', tier: 'molecule', category: 'layout', defaultProps: { height: 24 } },
  { id: 'pb_image', label: 'Image', tier: 'molecule', category: 'media', defaultProps: { src: '/next.svg', alt: '' } },
];

export const SHOWCASE_BLOCKS_BY_ID: Record<string, ShowcaseBlockManifestEntry> =
  Object.fromEntries(SHOWCASE_BLOCK_MANIFEST.map((b) => [b.id, b]));

export function getBlockManifestOrThrow(id: string): ShowcaseBlockManifestEntry {
  const b = SHOWCASE_BLOCKS_BY_ID[id];
  if (!b) throw new Error(`Unknown block: ${id}`);
  return b;
}
