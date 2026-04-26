'use client';

import type { ReactNode } from 'react';
import {
  Button,
  Badge,
  Heading,
  Text,
  Code,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Chip,
  UILink,
  Separator,
  Spinner,
  Progress,
  Avatar,
} from '@/components/ui/atoms';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  Hero,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Breadcrumbs,
  PageHeader,
  Banner,
  Pagination,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  LabelValuePair,
} from '@/components/ui/molecules';
import {
  Timeline,
  GanttChart,
  KanbanBoard,
  WidgetGrid,
  FilterBuilder,
  Footer,
  AIDisclaimer,
} from '@/components/ui/organisms';
import type {
  DataBinding,
  PageComponent,
} from '@/lib/core/ports/pages.repository';
import { pageComponentRegistry } from '@/lib/page-builder/page-component-registry';
import { getLazyAppComponent } from '@/lib/page-builder/lazy-app-components';
import { Suspense } from 'react';
import { usePageSelection } from '../runtime/PageContexts';
import { BoundMetricCard } from './data/BoundMetricCard';
import { BoundDataTable } from './data/BoundDataTable';
import { BoundChart } from './data/BoundChart';
import { BoundDetailHeader } from './data/BoundDetailHeader';
import { BoundKanban } from './data/BoundKanban';
import { BoundTimeline } from './data/BoundTimeline';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BlockRenderParams {
  type: string;
  props: Record<string, unknown>;
  dataBinding?: DataBinding;
  appId: string;
  /** Only set for container types (`isContainer: true`). */
  children?: PageComponent[];
  /**
   * Renderer for nested children — passed by `PageRenderer` so containers
   * never import the parent renderer (avoids a cycle).
   */
  renderChildren?: (children: PageComponent[]) => ReactNode;
}

function str(v: unknown, d = ''): string {
  return typeof v === 'string' ? v : d;
}

function num(v: unknown, d = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : d;
}

function bool(v: unknown, d = false): boolean {
  return typeof v === 'boolean' ? v : d;
}

function ConditionalGate({
  showWhen,
  children,
}: {
  showWhen: string;
  children: ReactNode;
}) {
  const { isSelected, selection } = usePageSelection();
  if (!showWhen) return <>{children}</>;
  if (!selection[showWhen] && !isSelected(showWhen)) return null;
  return <>{children}</>;
}

/**
 * Renders one canonical page-builder type. Both legacy `atom_*` ids and
 * canonical `metric-card`/`data-table`/etc. resolve here through the registry.
 */
export function renderBlock(p: BlockRenderParams): ReactNode {
  const { props, appId, dataBinding, children = [], renderChildren } = p;
  const def = pageComponentRegistry.get(p.type);
  const type = def?.type ?? p.type;

  switch (type) {
    // ─── Layout ───────────────────────────────────────────────────────
    case 'spacer':
      return <div style={{ height: num(props.height, 24) }} aria-hidden="true" />;
    case 'divider':
      return <Separator />;
    case 'card':
      return (
        <Card>
          {(str(props.title) || str(props.description)) && (
            <CardHeader>
              {str(props.title) && <CardTitle>{str(props.title, 'Card')}</CardTitle>}
            </CardHeader>
          )}
          <CardContent>
            {str(props.description) && (
              <Text size="sm" color="muted" className="mb-2">
                {str(props.description)}
              </Text>
            )}
            {children.length > 0 && renderChildren ? (
              <div className="space-y-3">{renderChildren(children)}</div>
            ) : null}
          </CardContent>
        </Card>
      );
    case 'footer':
      return <Footer className="border-t border-border" legalText={str(props.legalText, undefined)} />;

    // ─── Containers ───────────────────────────────────────────────────
    case 'tabs-container': {
      const labels = str(props.tabLabels, 'Overview, Details')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      // Each tab gets the corresponding child component (in order). Excess
      // labels render an empty body; excess children fall into the last tab.
      return (
        <Tabs defaultValue="t0">
          <TabsList>
            {labels.map((l, i) => (
              <TabsTrigger key={i} value={`t${i}`}>
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
          {labels.map((_, i) => {
            const childForTab = children[i] ?? null;
            return (
              <TabsContent key={i} value={`t${i}`}>
                {childForTab && renderChildren ? renderChildren([childForTab]) : (
                  <Text size="sm" color="muted">
                    Drop a block here for tab {i + 1}.
                  </Text>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      );
    }
    case 'conditional-container': {
      return (
        <ConditionalGate showWhen={str(props.showWhen)}>
          {renderChildren ? renderChildren(children) : null}
        </ConditionalGate>
      );
    }
    case 'collapsible-section': {
      const open = bool(props.defaultOpen, true);
      return (
        <Accordion type="single" collapsible defaultValue={open ? 'a1' : undefined}>
          <AccordionItem value="a1">
            <AccordionTrigger>{str(props.itemTitle, 'Section')}</AccordionTrigger>
            <AccordionContent>
              {renderChildren ? renderChildren(children) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    // ─── Content / typography ─────────────────────────────────────────
    case 'text-block': {
      // Map registry sizes to Text component sizes (Text uses `base` instead of `md`).
      const sizeRaw = str(props.size, 'md');
      const sizeMap: Record<string, 'xs' | 'sm' | 'base' | 'lg' | 'xl'> = {
        xs: 'xs',
        sm: 'sm',
        md: 'base',
        lg: 'lg',
        xl: 'xl',
      };
      const size = sizeMap[sizeRaw] ?? 'base';
      return (
        <Text size={size} className="whitespace-pre-wrap">
          {str(props.content, 'Body text')}
        </Text>
      );
    }
    case 'heading': {
      const lvl = (str(props.level, 'h2') as 'h1' | 'h2' | 'h3' | 'h4');
      const sizeMap: Record<string, string> = {
        h1: 'text-3xl',
        h2: 'text-2xl',
        h3: 'text-xl',
        h4: 'text-lg',
      };
      return (
        <Heading as={lvl} className={sizeMap[lvl]}>
          {str(props.children, 'Section title')}
        </Heading>
      );
    }
    case 'page-header':
      return <PageHeader title={str(props.title, 'Page')} description={str(props.subtitle, '')} />;
    case 'hero':
      return (
        <Hero
          title={str(props.title, 'Hero')}
          subtitle={str(props.subtitle, '')}
          variant="default"
        />
      );
    case 'alert-block':
      return (
        <Alert
          variant={(str(props.variant, 'info') as 'info' | 'success' | 'warning' | 'error')}
          title={str(props.title, 'Notice')}
        >
          {str(props.children, 'Message')}
        </Alert>
      );
    case 'badge':
      return <Badge>{str(props.children, 'Label')}</Badge>;
    case 'chip':
      return <Chip label={str(props.children, 'Tag')} />;
    case 'banner':
      return <Banner>{str(props.children, '')}</Banner>;
    case 'empty-state':
      return (
        <EmptyState
          title={str(props.title, 'No data')}
          description={str(props.description, '')}
        />
      );
    case 'label-value':
      return (
        <LabelValuePair label={str(props.label, 'Field')} value={str(props.value, '—')} />
      );
    case 'code':
      return <Code className="text-sm">{str(props.children, '')}</Code>;
    case 'spinner':
      return <Spinner size="md" />;
    case 'progress':
      return <Progress value={num(props.value, 50)} className="w-full" />;

    // ─── Buttons / actions ────────────────────────────────────────────
    case 'page-button': {
      const label = str(props.children, 'Button');
      // Map registry variants to Button component variants
      // (Button uses `danger`, registry uses `destructive`).
      const variantRaw = str(props.variant, 'primary');
      const variantMap: Record<string, 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger'> = {
        primary: 'primary',
        secondary: 'secondary',
        outline: 'outline',
        ghost: 'ghost',
        link: 'link',
        destructive: 'danger',
        danger: 'danger',
      };
      const variant = variantMap[variantRaw] ?? 'primary';
      const href = str(props.href);
      const btn = (
        <Button type="button" variant={variant}>
          {label}
        </Button>
      );
      if (href) {
        return (
          <Link href={href} className="inline-block">
            {btn}
          </Link>
        );
      }
      return btn;
    }
    case 'page-link':
      return <UILink href={str(props.href, '#')}>{str(props.children, 'Link')}</UILink>;
    case 'breadcrumbs': {
      const parts = str(props.items, 'Home, Here')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return (
        <Breadcrumbs
          items={parts.map((label, i) => ({
            label,
            href: i < parts.length - 1 ? '#' : undefined,
          }))}
        />
      );
    }
    case 'pagination':
      return (
        <Pagination
          currentPage={num(props.page, 1)}
          totalPages={num(props.pageCount, 1)}
          onPageChange={() => undefined}
        />
      );

    // ─── Form atoms ───────────────────────────────────────────────────
    case 'form-input':
      return <Input readOnly placeholder={str(props.placeholder)} />;
    case 'form-textarea':
      return <Textarea readOnly placeholder={str(props.placeholder)} />;
    case 'form-select':
      return (
        <Select disabled defaultValue="a">
          <option value="a">{str(props.placeholder, 'Select')}</option>
        </Select>
      );
    case 'form-checkbox':
      return <Checkbox label={str(props.label, 'Option')} checked disabled />;
    case 'form-switch':
      return <Switch label={str(props.label)} checked disabled />;
    case 'dynamic-form':
      return (
        <Text size="sm" color="muted" className="p-3 border border-dashed border-border rounded">
          Form embed — set form id in builder props (app: {appId}).
        </Text>
      );

    // ─── Data widgets ─────────────────────────────────────────────────
    case 'metric-card':
      return (
        <BoundMetricCard
          appId={appId}
          binding={dataBinding}
          label={str(props.label, 'KPI')}
          staticValue={str(props.value, '0')}
          aggregation={(str(props.aggregation, 'count') as 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first')}
          valueField={str(props.valueField, undefined)}
        />
      );
    case 'data-table':
      return (
        <BoundDataTable
          appId={appId}
          binding={dataBinding}
          title={str(props.title, 'Records')}
          pageSize={num(props.pageSize, 10)}
        />
      );
    case 'filter-builder':
      return (
        <FilterBuilder
          fields={[{ key: 'f1', label: 'Field', type: 'text' }]}
          filters={[]}
          onFiltersChange={() => undefined}
        />
      );
    case 'detail-header':
      return (
        <BoundDetailHeader
          appId={appId}
          binding={dataBinding}
          staticTitle={str(props.title, 'Record')}
          titleField={str(props.titleField, 'name')}
          descriptionField={str(props.descriptionField, undefined)}
          metadataFields={str(props.metadataFields, undefined)}
        />
      );
    case 'kanban-board': {
      const columnField = str(props.columnField, 'status');
      const titleField = str(props.titleField, 'name');
      const descField = str(props.descriptionField, undefined);
      // Without a binding we keep the empty column so the editor preview is
      // still meaningful. The bound case derives columns from distinct values
      // of `columnField` across the rows.
      if (!dataBinding || dataBinding.source === 'static') {
        return <KanbanBoard columns={[{ id: 'a', title: 'Col', items: [] }]} />;
      }
      return (
        <BoundKanban
          appId={appId}
          binding={dataBinding}
          columnField={columnField}
          titleField={titleField}
          descriptionField={descField}
        />
      );
    }
    case 'gantt-chart':
      return (
        <GanttChart
          columns={['D1', 'D2', 'D3']}
          rows={[
            {
              id: 'r1',
              label: 'Row 1',
              events: [{ id: 'e1', start: 0, end: 1, title: 'Block' }],
            },
          ]}
        />
      );
    case 'timeline': {
      if (!dataBinding || dataBinding.source === 'static') {
        return (
          <Timeline
            items={[{ id: '1', title: 'Event', date: 'Today', description: '…' }]}
          />
        );
      }
      return (
        <BoundTimeline
          appId={appId}
          binding={dataBinding}
          titleField={str(props.titleField, 'name')}
          dateField={str(props.dateField, 'created_at')}
          descriptionField={str(props.descriptionField, undefined)}
        />
      );
    }
    case 'widget-grid': {
      const n = num(props.columns, 2);
      const c = n <= 2 ? 2 : n >= 4 ? 4 : 3;
      return (
        <WidgetGrid columns={{ default: c }} gap="md">
          {children.length > 0 && renderChildren ? (
            renderChildren(children)
          ) : (
            Array.from({ length: n }, (_, i) => (
              <div key={i} className="p-2 border border-border rounded">
                <Text size="sm">Item {i + 1}</Text>
              </div>
            ))
          )}
        </WidgetGrid>
      );
    }

    // ─── Charts ───────────────────────────────────────────────────────
    case 'chart':
      return (
        <BoundChart
          appId={appId}
          binding={dataBinding}
          title={str(props.title, 'Chart')}
          type={(str(props.kind, 'bar') as 'bar' | 'line' | 'area' | 'pie')}
          dataKey={str(props.dataKey, 'value')}
          labelKey={str(props.labelKey, 'name')}
        />
      );

    // ─── Media ────────────────────────────────────────────────────────
    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={str(props.src, '/next.svg')}
          alt={str(props.alt, '')}
          className="max-w-full h-auto rounded border border-border"
        />
      );
    case 'iframe-embed':
      return (
        <iframe
          src={str(props.src)}
          height={num(props.height, 400)}
          className="w-full rounded border border-border"
          sandbox="allow-scripts allow-same-origin"
          title="Embedded content"
        />
      );
    case 'avatar':
      return (
        <Avatar
          fallback={str(props.fallback, '?')}
          src={str(props.src, undefined)}
          className="h-10 w-10"
        />
      );
    case 'ai-disclaimer':
      return <AIDisclaimer className="max-w-xl" />;
    case 'location-map':
      return (
        <div className="h-48 rounded border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground p-3 text-center">
          Map block — bind a table with lat/lng fields at runtime.
        </div>
      );

    default:
      return renderLazyOrUnknown(p);
  }
}

/**
 * Default block fallback. Custom components are rendered separately by
 * `ShowcaseBlockRenderer`, but vertical (domain) widgets registered in
 * `lazy-app-components.ts` are dynamic-imported here so layouts that already
 * reference a lazy widget keep rendering when the master flag is on. When
 * the flag is off, palette filtering prevents new inserts and stored
 * layouts referencing the type fall through to a clean placeholder card
 * — never the noisy "Unknown block" error.
 */
function renderLazyOrUnknown(p: BlockRenderParams): ReactNode {
  const def = pageComponentRegistry.get(p.type);
  const Lazy = getLazyAppComponent(p.type);
  if (Lazy) {
    return (
      <Suspense
        fallback={
          <div className="h-24 rounded border border-dashed border-border bg-muted/40 animate-pulse" />
        }
      >
        <Lazy
          appId={p.appId}
          props={p.props}
          dataBinding={p.dataBinding}
        />
      </Suspense>
    );
  }
  if (def) {
    return (
      <div
        className={cn(
          'text-sm text-muted-foreground border border-dashed border-border rounded p-3',
        )}
      >
        {def.label} placeholder
      </div>
    );
  }
  return (
    <div
      className={cn(
        'text-sm text-destructive border border-dashed border-destructive/40 rounded p-2',
      )}
    >
      Unknown block type: <code>{p.type}</code>
    </div>
  );
}

/**
 * @deprecated kept for back-compat with the older ShowcaseBlockRenderer name.
 * Prefer `renderBlock`. Drops `children` (existing callers passed flat blocks).
 */
export function renderShowcaseBlock(p: BlockRenderParams): ReactNode {
  return renderBlock(p);
}
