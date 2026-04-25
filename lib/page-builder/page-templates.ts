/**
 * Page templates — predefined layouts the user picks when creating a page.
 *
 * Mirrors GAB Core's `page-templates.ts` shape (id + name + description +
 * starter `layout`). New templates can be added without touching the editor;
 * the create dialog renders all entries automatically.
 */

import type { PageLayout } from '@/lib/core/ports/pages.repository';
import { makeComponentId, makeRowId } from './layout-helpers';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  /** Optional Lucide icon name shown in the picker. */
  icon?: string;
  build(): PageLayout;
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty single-column canvas. Build from scratch.',
    icon: 'File',
    build: () => ({ type: 'grid', rows: [{ id: makeRowId(), columns: 1, components: [] }] }),
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: '4 KPI tiles + a chart row + a data table.',
    icon: 'LayoutDashboard',
    build: () => ({
      type: 'grid',
      rows: [
        {
          id: makeRowId(),
          columns: 4,
          gap: 16,
          components: [1, 2, 3, 4].map((i) => ({
            id: makeComponentId(),
            type: 'metric-card',
            props: { label: `KPI ${i}`, value: '0' },
          })),
        },
        {
          id: makeRowId(),
          columns: 2,
          gap: 16,
          components: [
            {
              id: makeComponentId(),
              type: 'chart',
              props: { title: 'Trend', kind: 'line', dataKey: 'value' },
            },
            {
              id: makeComponentId(),
              type: 'chart',
              props: { title: 'Breakdown', kind: 'bar', dataKey: 'value' },
            },
          ],
        },
        {
          id: makeRowId(),
          columns: 1,
          components: [
            {
              id: makeComponentId(),
              type: 'data-table',
              props: { title: 'Records', pageSize: 10 },
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'list-view',
    name: 'List view',
    description: 'Filter bar above a data table.',
    icon: 'List',
    build: () => ({
      type: 'grid',
      rows: [
        {
          id: makeRowId(),
          columns: 1,
          components: [
            {
              id: makeComponentId(),
              type: 'page-header',
              props: { title: 'Records', subtitle: '' },
            },
          ],
        },
        {
          id: makeRowId(),
          columns: 1,
          components: [
            { id: makeComponentId(), type: 'filter-builder', props: {} },
          ],
        },
        {
          id: makeRowId(),
          columns: 1,
          components: [
            {
              id: makeComponentId(),
              type: 'data-table',
              props: { title: 'Records', pageSize: 25 },
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'detail',
    name: 'Record detail',
    description: 'Detail header above a 2-column metadata layout.',
    icon: 'FileText',
    build: () => ({
      type: 'grid',
      rows: [
        {
          id: makeRowId(),
          columns: 1,
          components: [
            {
              id: makeComponentId(),
              type: 'detail-header',
              props: { title: 'Record' },
            },
          ],
        },
        {
          id: makeRowId(),
          columns: 3,
          gap: 16,
          components: [
            {
              id: makeComponentId(),
              type: 'card',
              colSpan: 2,
              props: { title: 'Details' },
            },
            {
              id: makeComponentId(),
              type: 'card',
              colSpan: 1,
              props: { title: 'Activity' },
            },
          ],
        },
      ],
    }),
  },
  {
    id: 'form',
    name: 'Form page',
    description: 'Page header + embedded form.',
    icon: 'FormInput',
    build: () => ({
      type: 'grid',
      rows: [
        {
          id: makeRowId(),
          columns: 1,
          components: [
            {
              id: makeComponentId(),
              type: 'page-header',
              props: { title: 'New record', subtitle: '' },
            },
            {
              id: makeComponentId(),
              type: 'dynamic-form',
              props: { formId: '' },
            },
          ],
        },
      ],
    }),
  },
];
