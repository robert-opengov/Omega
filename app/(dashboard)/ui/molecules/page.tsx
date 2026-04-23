'use client';

import { useState } from 'react';
import {
  Inbox, Search, Home, Users, Settings, Plus, Trash2,
  FileText, MoreHorizontal,
  Bell, CheckCircle, Info, Star, Archive, Copy,
  AlertTriangle, Clock, Mail, Filter, MapPin, Blocks, Shield, Palette, File, Image,
  ChevronLeft, RefreshCw, Sparkles, DollarSign, TrendingUp,
  Building2, Car, TreePine, Droplets, Zap, MessageSquare, UserCheck,
} from 'lucide-react';
import { ShowcaseLayout } from '../_components/ShowcaseLayout';
import { z } from 'zod';
import {
  Button,
  Text,
  Badge,
  Chip,
  IconButton,
  UILink,
  StatusDot,
} from '@/components/ui/atoms';
import {
  Card, CardContent, CardHeader, CardTitle, CardSubtitle, CardDescription, CardFooter, CardInfo, CardMedia,
  FormField,
  SearchInput,
  DataTable, type Column,
  MetricCard,
  Alert,
  Modal,
  Sheet,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Pagination,
  AvatarGroup,
  ProgressSteps,
  DatePicker,
  ConfirmDialog,
  TagInput,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  FileUpload,
  PageHeader,
  Popover, PopoverTrigger, PopoverContent,
  Breadcrumbs,
  CommandPalette, type CommandItem,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  EmptyState,
  Combobox,
  ZodForm,
  List, ListItem, ListItemIcon, ListItemAvatar, ListItemText, ListDivider,
  LabelValuePair,
  Toolbar,
  Result,
  OnboardingWizard,
  Banner,
  Hero,
  SummaryCard,
  FilePreviewCard,
  CheckboxTree,
  WizardCard,
  CollapsibleTable, type CollapsibleTableColumn, type CollapsibleTableRow,
  UploadSlot,
  StatusChecklist,
  ContentHeader,
  SectionHeader,
  InfoCard,
  ValueItem,
  DeadlineItem,
  BreakdownCard,
  ExpandableListItem,
  ComposeInput,
  LabeledProgressRow,
  PageContent,
  ResponsiveGrid,
  AddressInput,
  MentionInput,
  CategoryGrid,
  ActivityFeed,
  DashboardWidget,
  SiteBanner,
} from '@/components/ui/molecules';
import { useToast } from '@/providers/toast-provider';
import { ComponentDemo, Section } from '../_components/ComponentDemo';

export default function MoleculesPage() {
  return (
    <ShowcaseLayout>
      <div className="space-y-12">

      <Section title="Layout" count={7}>
        <ContentHeaderDemo />
        <CardDemo />
        <PageContentDemo />
        <ResponsiveGridDemo />
        <PageHeaderDemo />
        <BreadcrumbsDemo />
        <EmptyStateDemo />
      </Section>

      <Section title="Data Display" count={4}>
        <DataTableDemo />
        <MetricCardDemo />
        <AvatarGroupDemo />
        <ProgressStepsDemo />
      </Section>

      <Section title="Forms" count={7}>
        <FormFieldDemo />
        <SearchInputDemo />
        <ZodFormDemo />
        <DatePickerDemo />
        <FileUploadDemo />
        <ComboboxDemo />
        <TagInputDemo />
      </Section>

      <Section title="Overlays" count={8}>
        <ModalDemo />
        <SheetDemo />
        <ConfirmDialogDemo />
        <ToastDemo />
        <AlertDemo />
        <DropdownMenuDemo />
        <PopoverDemo />
        <CommandPaletteDemo />
      </Section>

      <Section title="Navigation" count={4}>
        <TabsDemo />
        <AccordionDemo />
        <PaginationDemo />
        <OnboardingWizardDemo />
      </Section>

      <Section title="Parity Components" count={4}>
        <ListDemo />
        <LabelValuePairDemo />
        <ToolbarDemo />
        <ResultDemo />
      </Section>

      <Section title="Wizard Components" count={4} description="Molecules for fullscreen form wizard flows.">
        <WizardCardDemo />
        <CollapsibleTableDemo />
        <UploadSlotDemo />
        <StatusChecklistDemo />
      </Section>

      <Section title="Content Components" count={6} description="Heroes, banners, file previews, and hierarchical selection.">
        <SiteBannerDemo />
        <BannerDemo />
        <HeroDemo />
        <SummaryCardDemo />
        <FilePreviewCardDemo />
        <CheckboxTreeDemo />
      </Section>

      <Section title="Interactive Inputs" count={3} description="Specialized input molecules for address lookup, mentions, and category selection.">
        <AddressInputDemo />
        <MentionInputDemo />
        <CategoryGridDemo />
      </Section>

      <Section title="Feed & Widgets" count={2} description="Activity feed and dashboard widget patterns.">
        <ActivityFeedDemo />
        <DashboardWidgetDemo />
      </Section>

      <Section title="Domain Components" count={9} description="Molecules built for data-intensive verticals, reusable across any application.">
        <SectionHeaderDemo />
        <InfoCardDemo />
        <ValueItemDemo />
        <DeadlineItemDemo />
        <BreakdownCardDemo />
        <ExpandableListItemDemo />
        <ComposeInputDemo />
        <LabeledProgressRowDemo />
      </Section>
      </div>
    </ShowcaseLayout>
  );
}

/* ---------- Layout ---------- */

function ContentHeaderDemo() {
  return (
    <ComponentDemo
      name="ContentHeader"
      description="Composable gray-background detail/form page header with optional nav controls, utility links, breadcrumbs, title, subtitle, and tabs."
      props={`interface ContentHeaderProps {
  navActions?: ReactNode;
  utilityActions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  titleSize?: 'large' | 'small';
  titleActions?: ReactNode;
  tabs?: ReactNode;
}`}
    >
      <div className="space-y-8">
        {/* Minimal */}
        <div>
          <Text size="xs" weight="semibold" color="muted" className="mb-2 uppercase tracking-wider">Minimal</Text>
          <div className="rounded-lg overflow-hidden border border-border">
            <ContentHeader title="Dashboard" />
          </div>
        </div>

        {/* With breadcrumbs + subtitle */}
        <div>
          <Text size="xs" weight="semibold" color="muted" className="mb-2 uppercase tracking-wider">With breadcrumbs + subtitle</Text>
          <div className="rounded-lg overflow-hidden border border-border">
            <ContentHeader
              breadcrumbs={[
                { label: 'Home', href: '#', icon: Home },
                { label: 'Projects', href: '#' },
                { label: 'PRJ-2024-001' },
              ]}
              title="Infrastructure Improvement Program"
              subtitle="Record #2024-001 · Active"
              titleSize="large"
            />
          </div>
        </div>

        {/* Full */}
        <div>
          <Text size="xs" weight="semibold" color="muted" className="mb-2 uppercase tracking-wider">Full (nav + utility + breadcrumbs + title + tabs)</Text>
          <div className="rounded-lg overflow-hidden border border-border">
            <ContentHeader
              navActions={
                <>
                  <IconButton icon={ChevronLeft} label="Back" variant="outline" size="sm" />
                  <IconButton icon={RefreshCw} label="Refresh" variant="outline" size="sm" />
                </>
              }
              utilityActions={
                <>
                  <UILink href="#" size="sm" color="primary" display="inline">
                    Get help
                  </UILink>
                  <UILink href="#" size="sm" color="primary" display="inline">
                    Settings
                  </UILink>
                </>
              }
              breadcrumbs={[
                { label: 'Home', href: '#' },
                { label: 'Programs', href: '#' },
                { label: 'Forms', href: '#' },
                { label: 'Add Form' },
              ]}
              title="{Form Name}"
              subtitle="Record #123456789"
              tabs={
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="contact">Contact Information</TabsTrigger>
                    <TabsTrigger value="payment">Payment Method</TabsTrigger>
                  </TabsList>
                </Tabs>
              }
            />
          </div>
        </div>

        {/* Small title variant */}
        <div>
          <Text size="xs" weight="semibold" color="muted" className="mb-2 uppercase tracking-wider">Small title + title actions</Text>
          <div className="rounded-lg overflow-hidden border border-border">
            <ContentHeader
              title="Quarterly Report"
              titleSize="small"
              titleActions={<Badge variant="success" size="sm">Approved</Badge>}
              subtitle="Submitted by Jane Smith on Mar 15, 2026"
            />
          </div>
        </div>
      </div>
    </ComponentDemo>
  );
}

function CardDemo() {
  return (
    <ComponentDemo
      name="Card"
      description="Flexible slot-based container. Every sub-component is optional — use only what you need."
      props={`interface CardProps { variant?: 'default' | 'outlined' | 'elevated'; }

Sub-components (all optional):
  CardMedia      — image/map/video at the top (src or children)
  CardHeader     — wrapper; action prop adds a top-right slot
                   variant?: 'default' | 'filled' (filled = muted bg flush to edges)
  CardSubtitle   — small uppercase label above or below title
  CardTitle      — heading (h2/h3/h4)
  CardDescription — muted paragraph
  CardInfo       — icon with tooltip (designed for CardHeader action)
  CardContent    — main body
  CardFooter     — bottom row with flex gap for buttons`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardMedia src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=300&fit=crop" alt="City skyline" />
          <CardHeader action={<CardInfo content="Infrastructure request submitted via the service portal." />}>
            <CardSubtitle>Infrastructure</CardSubtitle>
            <CardTitle>Pothole on Main St</CardTitle>
            <CardDescription>Large pothole causing traffic issues near the downtown area.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="inProgress">In Progress</Badge>
              <Badge variant="info">Priority</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="outline">Details</Button>
            <Button size="sm">Assign</Button>
          </CardFooter>
        </Card>

        <Card variant="outlined">
          <CardHeader action={<CardInfo content="Monthly performance metrics for Q1 2026." />}>
            <CardTitle>Performance Report</CardTitle>
            <CardDescription>Q1 2026 Summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text size="sm" color="muted">Resolution Rate</Text>
                <Text size="sm" weight="semibold" color="foreground">94.2%</Text>
              </div>
              <div className="flex justify-between">
                <Text size="sm" color="muted">Avg Response Time</Text>
                <Text size="sm" weight="semibold" color="foreground">2.4 hrs</Text>
              </div>
              <div className="flex justify-between">
                <Text size="sm" color="muted">Citizen Satisfaction</Text>
                <Text size="sm" weight="semibold" color="foreground">4.7/5.0</Text>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="outline">Export</Button>
            <Button size="sm" variant="ghost">View Full Report</Button>
          </CardFooter>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
            <CardDescription>Just a title and description. All other slots are optional and omitted here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Text size="sm" color="muted">
              This proves backward compatibility — no media, no info tooltip, no subtitle, no footer. Still looks clean.
            </Text>
          </CardContent>
        </Card>
      </div>

      <Text size="xs" weight="semibold" color="muted" className="mt-6 uppercase tracking-wider">Filled header variant</Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <Card>
          <CardHeader variant="filled" action={<CardInfo content="Compliance data refreshed daily." />}>
            <CardTitle>Compliance Flags</CardTitle>
            <CardDescription>Identify and resolve compliance risks before they become issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="danger" size="sm" shape="pill">Critical</Badge>
                <Text size="sm" weight="medium">DOJ COPS Hiring — budget at 91% utilization</Text>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="warning" size="sm" shape="pill">Warning</Badge>
                <Text size="sm" weight="medium">CDBG-DR — burn rate below pace</Text>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader variant="filled">
            <CardTitle>Program Overview</CardTitle>
            <CardDescription>Summary of all active programs and their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text size="sm" color="muted">Active Programs</Text>
                <Text size="sm" weight="semibold" color="foreground">12</Text>
              </div>
              <div className="flex justify-between">
                <Text size="sm" color="muted">Pending Review</Text>
                <Text size="sm" weight="semibold" color="foreground">3</Text>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ComponentDemo>
  );
}

function PageHeaderDemo() {
  return (
    <ComponentDemo
      name="PageHeader"
      description="Page title bar with breadcrumbs, stats, status chips, and configurable title size."
      props={`interface PageHeaderProps {
  title: string; description?: string; actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  stats?: { label: string; value: string; icon?: 'up' | 'down' | 'flat' }[];
  status?: { label: string; variant?: string }[];
  titleSize?: 'large' | 'small'; condensed?: boolean;
}`}
    >
      <div className="space-y-8">
        <PageHeader
          title="Service Requests"
          description="Manage all incoming citizen requests"
          breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Requests' }]}
          stats={[
            { label: 'Open', value: '42', icon: 'up' },
            { label: 'Resolved', value: '128', icon: 'flat' },
          ]}
          status={[{ label: 'Active', variant: 'success' }]}
          actions={<Button icon={Plus} size="sm">New Request</Button>}
        />
        <PageHeader
          title="Condensed Header"
          description="Tighter padding for dense layouts"
          titleSize="small"
          condensed
        />
      </div>
    </ComponentDemo>
  );
}

function BreadcrumbsDemo() {
  return (
    <ComponentDemo
      name="Breadcrumbs"
      description="Navigation path with linked segments."
      props={`interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
  className?: string;
}`}
    >
      <Breadcrumbs items={[
        { label: 'Home', href: '#' },
        { label: 'Projects', href: '#' },
        { label: 'GAB Platform', href: '#' },
        { label: 'Settings' },
      ]} />
    </ComponentDemo>
  );
}

function EmptyStateDemo() {
  return (
    <ComponentDemo
      name="EmptyState"
      description="Placeholder for empty content areas with optional CTA."
      props={`interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}`}
    >
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        description="Create your first service request to get started."
        action={{ label: 'Create Request', onClick: () => {} }}
      />
    </ComponentDemo>
  );
}

/* ---------- Data Display ---------- */

const sampleTableData = [
  { id: '1', name: 'Alice Johnson', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Bob Smith', role: 'User', status: 'Active' },
  { id: '3', name: 'Charlie Brown', role: 'User', status: 'Inactive' },
  { id: '4', name: 'Diana Ross', role: 'Moderator', status: 'Active' },
  { id: '5', name: 'Eve Wilson', role: 'User', status: 'Pending' },
];

const tableColumns: Column<typeof sampleTableData[0]>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  {
    key: 'status', header: 'Status', sortable: true,
    render: (row) => {
      const variant = row.status === 'Active' ? 'success' : row.status === 'Pending' ? 'warning' : 'default';
      return <Badge variant={variant}>{row.status}</Badge>;
    },
  },
];

function DataTableDemo() {
  return (
    <ComponentDemo
      name="DataTable"
      description="Sortable data table with custom cell renderers."
      props={`interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  tableLabel?: string;
  className?: string;
}`}
    >
      <DataTable
        data={sampleTableData}
        columns={tableColumns}
        keyExtractor={(r) => r.id}
        tableLabel="Users table"
      />
    </ComponentDemo>
  );
}

function MetricCardDemo() {
  return (
    <ComponentDemo
      name="MetricCard"
      description="Metric card with value, optional trend, icon, description, and children slot. Supports variant and size."
      props={`interface MetricCardProps {
  title: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  trend?: ReactNode;
  icon?: ElementType;
  children?: ReactNode;
  variant?: 'default' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Users"
          value="1,284"
          description="12.5% increase vs last month"
          icon={Users}
          trend={<Badge variant="success" size="sm">+12.5%</Badge>}
        />
        <MetricCard
          title="Open Requests"
          value={42}
          description="Down 8.3% vs last week"
          icon={FileText}
          trend={<Badge variant="danger" size="sm">-8.3%</Badge>}
        />
        <MetricCard
          title="Resolution Rate"
          value="94%"
          icon={CheckCircle}
          variant="outlined"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <MetricCard
          title="Budget Allocated"
          value="$2.4M"
          description="Fiscal year 2026"
          icon={DollarSign}
          size="lg"
          variant="default"
          trend={<Badge variant="success" size="sm">On track</Badge>}
        />
        <MetricCard
          title="Compact Metric"
          value="37"
          description="Small card with ghost variant"
          icon={TrendingUp}
          size="sm"
          variant="ghost"
        />
      </div>
    </ComponentDemo>
  );
}

function AvatarGroupDemo() {
  return (
    <ComponentDemo
      name="AvatarGroup"
      description="Stacked avatars with overflow count."
      props={`interface AvatarGroupProps {
  avatars: { src?: string; fallback: string; alt?: string }[];
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}`}
    >
      <div className="flex flex-col gap-4">
        <AvatarGroup
          avatars={[
            { fallback: 'AJ' },
            { fallback: 'BS' },
            { fallback: 'CD' },
            { fallback: 'DR' },
            { fallback: 'EW' },
            { fallback: 'FG' },
          ]}
          max={4}
        />
        <AvatarGroup
          avatars={[
            { fallback: 'A' },
            { fallback: 'B' },
            { fallback: 'C' },
          ]}
          max={5}
          size="lg"
        />
      </div>
    </ComponentDemo>
  );
}

function ProgressStepsDemo() {
  const [step, setStep] = useState(1);
  return (
    <ComponentDemo
      name="ProgressSteps"
      description="Step indicator for multi-step workflows."
      props={`interface ProgressStepsProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}`}
    >
      <div className="space-y-4">
        <ProgressSteps
          steps={[
            { label: 'Details', description: 'Enter basic info' },
            { label: 'Address', description: 'Location data' },
            { label: 'Review', description: 'Confirm submission' },
            { label: 'Done', description: 'Submitted' },
          ]}
          currentStep={step}
          onStepClick={setStep}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setStep(Math.max(0, step - 1))}>Back</Button>
          <Button size="sm" onClick={() => setStep(Math.min(3, step + 1))}>Next</Button>
        </div>
      </div>
    </ComponentDemo>
  );
}

/* ---------- Forms ---------- */

function FormFieldDemo() {
  return (
    <ComponentDemo
      name="FormField"
      description="Label + Input + error/hint in a single molecule."
      props={`interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <FormField label="Full Name" placeholder="Jane Doe" required />
        <FormField label="Email" type="email" placeholder="jane@gov.com" hint="We'll never share it" />
        <FormField label="Phone" placeholder="(555) 123-4567" error="Invalid phone number" />
        <FormField label="City" placeholder="Springfield" disabled />
      </div>
    </ComponentDemo>
  );
}

function SearchInputDemo() {
  const [search, setSearch] = useState('');
  return (
    <ComponentDemo
      name="SearchInput"
      description="Search field with debounce, clear button, and search icon."
      props={`interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}`}
    >
      <div className="max-w-sm space-y-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." debounceMs={300} />
        <Text size="xs" color="muted">Current value: &quot;{search}&quot;</Text>
      </div>
    </ComponentDemo>
  );
}

const demoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
});

function ZodFormDemo() {
  const [result, setResult] = useState<string>('');
  return (
    <ComponentDemo
      name="ZodForm"
      description="Render-prop form with Zod validation and react-hook-form."
      props={`interface ZodFormProps<T> {
  schema: z.ZodType<T>;
  defaultValues?: Partial<T>;
  onSubmit: SubmitHandler<T>;
  children: (methods: UseFormReturn<T>) => ReactNode;
  className?: string;
}`}
    >
      <div className="max-w-sm space-y-4">
        <ZodForm
          schema={demoSchema}
          onSubmit={(data) => { setResult(JSON.stringify(data, null, 2)); }}
        >
          {({ register, formState: { errors } }) => (
            <>
              <FormField label="Name" {...register('name')} error={errors.name?.message} required />
              <FormField label="Email" {...register('email')} error={errors.email?.message} required />
              <Button type="submit" size="sm">Submit</Button>
            </>
          )}
        </ZodForm>
        {result && (
          <pre className="text-xs bg-muted/50 rounded p-3 font-mono">{result}</pre>
        )}
      </div>
    </ComponentDemo>
  );
}

function DatePickerDemo() {
  const [date, setDate] = useState('');
  return (
    <ComponentDemo
      name="DatePicker"
      description="Native date input with label, validation, and min/max."
      props={`interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <DatePicker label="Start Date" value={date} onChange={setDate} required />
        <DatePicker label="End Date" min="2024-01-01" max="2025-12-31" />
        <DatePicker label="Disabled" disabled />
        <DatePicker label="With Error" error="Date is required" />
      </div>
    </ComponentDemo>
  );
}

function FileUploadDemo() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <ComponentDemo
      name="FileUpload"
      description="Drag-and-drop file upload with validation."
      props={`interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  onFilesChange: (files: File[]) => void;
  className?: string;
}`}
    >
      <div className="max-w-md space-y-2">
        <FileUpload
          accept="image/*,.pdf"
          maxSize={5 * 1024 * 1024}
          maxFiles={3}
          multiple
          onFilesChange={setFiles}
        />
        {files.length > 0 && (
          <Text size="xs" color="muted">
            Selected: {files.map((f) => f.name).join(', ')}
          </Text>
        )}
      </div>
    </ComponentDemo>
  );
}

function ComboboxDemo() {
  const [value, setValue] = useState('');
  return (
    <ComponentDemo
      name="Combobox"
      description="Searchable dropdown select."
      props={`interface ComboboxProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}`}
    >
      <div className="max-w-xs space-y-2">
        <Combobox
          options={[
            { label: 'New York', value: 'ny' },
            { label: 'Los Angeles', value: 'la' },
            { label: 'Chicago', value: 'chi' },
            { label: 'Houston', value: 'hou' },
            { label: 'Phoenix', value: 'phx' },
          ]}
          value={value}
          onChange={setValue}
          placeholder="Select a city..."
        />
        <Text size="xs" color="muted">Selected: {value || 'none'}</Text>
      </div>
    </ComponentDemo>
  );
}

function TagInputDemo() {
  const [tags, setTags] = useState(['urgent', 'infrastructure']);
  return (
    <ComponentDemo
      name="TagInput"
      description="Chip-style multi-value input with keyboard support."
      props={`interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}`}
    >
      <div className="max-w-sm">
        <TagInput
          tags={tags}
          onTagsChange={setTags}
          placeholder="Add tags..."
          maxTags={5}
        />
      </div>
    </ComponentDemo>
  );
}

/* ---------- Overlays ---------- */

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <ComponentDemo
      name="Modal"
      description="Centered dialog overlay with Radix UI."
      props={`interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  hideCloseButton?: boolean;
}`}
    >
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal open={open} onOpenChange={setOpen} title="Example Modal" description="This is a demo modal with some content.">
        <div className="space-y-4">
          <FormField label="Your Name" placeholder="Jane Doe" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </div>
        </div>
      </Modal>
    </ComponentDemo>
  );
}

function SheetDemo() {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<'left' | 'right' | 'bottom'>('right');
  const [modal, setModal] = useState(true);
  const [footerMode, setFooterMode] = useState<'none' | 'actions' | 'custom'>('none');
  return (
    <ComponentDemo
      name="Sheet"
      description="Slide-over panel from left, right, or bottom. Supports modal (overlay + focus trap) and modeless modes."
      props={`interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: 'left' | 'right' | 'bottom';
  modal?: boolean;           // default true
  hideCloseButton?: boolean;
  footer?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
  destructiveAction?: DialogAction;
}`}
    >
      <div className="flex flex-wrap gap-2">
        {(['left', 'right', 'bottom'] as const).map((s) => (
          <Button key={s} variant="outline" size="sm" onClick={() => { setSide(s); setOpen(true); }}>
            Sheet ({s})
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" checked={modal} onChange={(e) => setModal(e.target.checked)} />
          Modal overlay
        </label>
        <select
          value={footerMode}
          onChange={(e) => setFooterMode(e.target.value as 'none' | 'actions' | 'custom')}
          className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
        >
          <option value="none">No footer</option>
          <option value="actions">Action buttons</option>
          <option value="custom">Custom footer</option>
        </select>
      </div>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        side={side}
        modal={modal}
        title={`Sheet — ${side}`}
        description={modal ? 'Modal: overlay locks the background.' : 'Modeless: interact with the page behind.'}
        {...(footerMode === 'actions' ? {
          primaryAction: { label: 'Save', onClick: () => setOpen(false) },
          secondaryAction: { label: 'Cancel', onClick: () => setOpen(false) },
        } : {})}
        {...(footerMode === 'custom' ? {
          footer: (
            <div className="flex items-center justify-between w-full">
              <Text className="text-xs text-muted-foreground">Custom footer slot</Text>
              <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Done</Button>
            </div>
          ),
        } : {})}
      >
        <div className="space-y-4">
          <Text>This panel slides from the <strong>{side}</strong>.</Text>
          <Text className="text-sm text-muted-foreground">
            {modal
              ? 'The backdrop overlay is visible and focus is trapped inside. Press Escape or click the overlay to close.'
              : 'No overlay — you can interact with the content behind this panel. Press Escape or the X to close.'}
          </Text>
        </div>
      </Sheet>
    </ComponentDemo>
  );
}

function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<'default' | 'danger' | 'primary'>('danger');
  return (
    <ComponentDemo
      name="ConfirmDialog"
      description="Confirmation dialog with customizable variant."
      props={`interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
}`}
    >
      <div className="flex gap-2">
        {(['default', 'danger', 'primary'] as const).map((v) => (
          <Button key={v} variant={v === 'danger' ? 'danger' : 'outline'} size="sm" onClick={() => { setVariant(v); setOpen(true); }}>
            {v}
          </Button>
        ))}
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm Action"
        description="Are you sure you want to proceed? This cannot be undone."
        variant={variant}
        onConfirm={() => setOpen(false)}
      />
    </ComponentDemo>
  );
}

function ToastDemo() {
  const { addToast } = useToast();
  return (
    <ComponentDemo
      name="Toast / ToastContainer"
      description="Notification toasts triggered via useToast() hook."
      props={`// useToast() hook:
addToast(message: string, variant?: 'success' | 'error' | 'warning' | 'info', duration?: number)

// ToastContainer rendered in layout — no props needed.`}
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => addToast('Information message', 'info')}>Info</Button>
        <Button size="sm" variant="outline" onClick={() => addToast('Operation successful!', 'success')}>Success</Button>
        <Button size="sm" variant="outline" onClick={() => addToast('Something might be wrong', 'warning')}>Warning</Button>
        <Button size="sm" variant="outline" onClick={() => addToast('An error occurred', 'error')}>Error</Button>
      </div>
    </ComponentDemo>
  );
}

function AlertDemo() {
  return (
    <ComponentDemo
      name="Alert"
      description="Inline alert with icon, title, and dismiss option."
      props={`interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void;
}
// variant: 'info' | 'success' | 'warning' | 'error'`}
    >
      <div className="space-y-3">
        {(['info', 'success', 'warning', 'error'] as const).map((v) => (
          <Alert key={v} variant={v} title={`${v.charAt(0).toUpperCase()}${v.slice(1)} Alert`} dismissible>
            This is a {v} alert message with additional details.
          </Alert>
        ))}
      </div>
    </ComponentDemo>
  );
}

function DropdownMenuDemo() {
  return (
    <ComponentDemo
      name="DropdownMenu"
      description="Context menu built on Radix UI primitives."
      props={`Radix-based compound component:
DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" icon={MoreHorizontal}>
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem><Star className="h-4 w-4 mr-2" /> Favorite</DropdownMenuItem>
          <DropdownMenuItem><Archive className="h-4 w-4 mr-2" /> Archive</DropdownMenuItem>
          <DropdownMenuItem><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ComponentDemo>
  );
}

function PopoverDemo() {
  return (
    <ComponentDemo
      name="Popover"
      description="Floating content panel anchored to a trigger."
      props={`Radix-based compound component:
Popover, PopoverTrigger, PopoverContent`}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" icon={Bell}>
            Notifications
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-3">
            <Text weight="semibold" color="foreground">Notifications</Text>
            <div className="space-y-2">
              {['New request submitted', 'Report approved', 'System update'].map((msg) => (
                <div key={msg} className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </ComponentDemo>
  );
}

function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const items: CommandItem[] = [
    { label: 'Go to Home', value: 'home', icon: Home, description: 'Navigate to dashboard', onSelect: () => setOpen(false) },
    { label: 'Search Users', value: 'users', icon: Users, description: 'Find user accounts', onSelect: () => setOpen(false) },
    { label: 'Open Settings', value: 'settings', icon: Settings, description: 'App configuration', onSelect: () => setOpen(false) },
    { label: 'Create Report', value: 'report', icon: FileText, description: 'Generate new report', onSelect: () => setOpen(false) },
  ];
  return (
    <ComponentDemo
      name="CommandPalette"
      description="Searchable command dialog for keyboard-first navigation."
      props={`interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
}
interface CommandItem {
  label: string;
  value: string;
  icon?: ElementType;
  description?: string;
  onSelect: () => void;
}`}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} icon={Search}>
        Command Palette
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} items={items} placeholder="Type a command..." />
    </ComponentDemo>
  );
}

/* ---------- Navigation ---------- */

function TabsDemo() {
  return (
    <ComponentDemo
      name="Tabs"
      description="Tabbed content panels with Radix UI."
      props={`Radix-based compound component:
Tabs, TabsList, TabsTrigger, TabsContent`}
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Text size="sm" color="muted" className="p-4">Overview tab content with summary information.</Text>
        </TabsContent>
        <TabsContent value="details">
          <Text size="sm" color="muted" className="p-4">Detailed information and specifications.</Text>
        </TabsContent>
        <TabsContent value="activity">
          <Text size="sm" color="muted" className="p-4">Recent activity log and timeline.</Text>
        </TabsContent>
      </Tabs>
    </ComponentDemo>
  );
}

function AccordionDemo() {
  return (
    <ComponentDemo
      name="Accordion"
      description="Collapsible content sections with Radix UI."
      props={`Radix-based compound component:
Accordion, AccordionItem, AccordionTrigger, AccordionContent`}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="faq-1">
          <AccordionTrigger>What is GAB?</AccordionTrigger>
          <AccordionContent>
            GAB (Government App Builder) is a platform for generating citizen-facing applications from prompts.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-2">
          <AccordionTrigger>How do I customize the theme?</AccordionTrigger>
          <AccordionContent>
            Edit the theme variables in <code className="text-xs bg-muted px-1 rounded">config/app.config.ts</code> or set NEXT_PUBLIC_THEME_PRIMARY in your environment.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-3">
          <AccordionTrigger>Can I use this with different APIs?</AccordionTrigger>
          <AccordionContent>
            Yes — the Clean Architecture ports make it easy to swap adapters for any backend API version.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ComponentDemo>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(3);
  return (
    <ComponentDemo
      name="Pagination"
      description="Page navigation with prev/next and page numbers."
      props={`interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}`}
    >
      <div className="space-y-2">
        <Pagination currentPage={page} totalPages={12} onPageChange={setPage} />
        <Text size="xs" color="muted" className="text-center">Page {page} of 12</Text>
      </div>
    </ComponentDemo>
  );
}

function OnboardingWizardDemo() {
  return (
    <ComponentDemo
      name="OnboardingWizard"
      description="Step-based wizard with indicators, content slots, and navigation."
      props={`interface OnboardingWizardProps {
  steps: { title: string; description?: string; content: ReactNode }[];
  onComplete?: () => void;
  initialStep?: number;
  className?: string;
}`}
    >
      <OnboardingWizard
        steps={[
          {
            title: 'Welcome',
            description: 'Get started with your new account.',
            content: <Text size="sm" color="muted">Welcome to the platform! This wizard will guide you through the initial setup.</Text>,
          },
          {
            title: 'Profile',
            description: 'Tell us about yourself.',
            content: (
              <div className="space-y-3 max-w-sm">
                <FormField label="Display Name" placeholder="Jane Doe" />
                <FormField label="Department" placeholder="Engineering" />
              </div>
            ),
          },
          {
            title: 'Preferences',
            description: 'Customize your experience.',
            content: <Text size="sm" color="muted">Choose your notification preferences and dashboard layout.</Text>,
          },
        ]}
        onComplete={() => alert('Onboarding complete!')}
      />
    </ComponentDemo>
  );
}

/* ---------- New Parity Components ---------- */

function ListDemo() {
  const [selected, setSelected] = useState('1');
  return (
    <ComponentDemo
      name="List"
      description="Selectable list with icons, avatars, and descriptions."
      props={`Compound component: List, ListItem, ListItemIcon, ListItemAvatar, ListItemText, ListDivider
ListItem: selected?, disabled?, onClick?, secondaryAction?
ListItemText: primary, secondary?`}
    >
      <div className="max-w-sm border border-border rounded">
        <List>
          <ListItem selected={selected === '1'} onClick={() => setSelected('1')}>
            <ListItemIcon icon={Home} />
            <ListItemText primary="Dashboard" secondary="Overview and stats" />
          </ListItem>
          <ListDivider inset />
          <ListItem selected={selected === '2'} onClick={() => setSelected('2')}>
            <ListItemIcon icon={Users} />
            <ListItemText primary="Team Members" secondary="Manage your team" />
          </ListItem>
          <ListDivider inset />
          <ListItem selected={selected === '3'} onClick={() => setSelected('3')}>
            <ListItemAvatar fallback="JD" />
            <ListItemText primary="Jane Doe" secondary="jane@gov.com" />
            <Badge variant="success" size="sm">Active</Badge>
          </ListItem>
          <ListDivider inset />
          <ListItem disabled>
            <ListItemIcon icon={Settings} />
            <ListItemText primary="Admin Settings" secondary="Restricted access" />
          </ListItem>
        </List>
      </div>
    </ComponentDemo>
  );
}

function LabelValuePairDemo() {
  return (
    <ComponentDemo
      name="LabelValuePair"
      description="Label + value display with optional chip rendering."
      props={`interface LabelValuePairProps {
  label: string; value: string;
  asChip?: boolean; chipProps?: Partial<ChipProps>;
  stacked?: boolean; icon?: ElementType;
}`}
    >
      <div className="space-y-4 max-w-sm">
        <LabelValuePair label="Department" value="Engineering" />
        <LabelValuePair label="Status" value="Active" asChip chipProps={{ color: 'success' }} />
        <LabelValuePair label="Location" value="San Francisco" stacked icon={MapPin} />
        <LabelValuePair label="Role" value="Admin" asChip chipProps={{ variant: 'strong', color: 'primary' }} />
      </div>
    </ComponentDemo>
  );
}

function ToolbarDemo() {
  return (
    <ComponentDemo
      name="Toolbar"
      description="Composable action bar with search, filter, and action slots."
      props={`interface ToolbarProps {
  leading?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}`}
    >
      <Toolbar
        leading={<SearchInput placeholder="Search records..." />}
        filters={
          <Combobox
            options={[
              { label: 'Engineering', value: 'eng' },
              { label: 'Design', value: 'des' },
              { label: 'Product', value: 'prod' },
            ]}
            placeholder="Department"
          />
        }
        actions={
          <>
            <Button variant="outline" size="sm" icon={Filter}>Filter</Button>
            <Button size="sm" icon={Plus}>Add Record</Button>
          </>
        }
      />
    </ComponentDemo>
  );
}

function ResultDemo() {
  return (
    <ComponentDemo
      name="Result / EmptyState"
      description="Enhanced with warning status, default icons, 4 sizes, and placeholderContainer."
      props={`interface EmptyStateProps {
  status?: 'empty' | 'error' | 'success' | 'warning' | 'info';
  icon?: ElementType; title: string; size?: 'small' | 'medium' | 'large' | 'xlarge';
  description?: string; subTitle?: string; placeholderContainer?: boolean;
  actions?: ResultAction[];
}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Result status="empty" title="No results found" subTitle="Try adjusting your search criteria." actions={[{ label: 'Clear Filters', onClick: () => {} }]} />
          <Result status="error" title="Something went wrong" subTitle="Please try again later." actions={[{ label: 'Retry', onClick: () => {} }, { label: 'Go Back', onClick: () => {}, variant: 'outline' }]} />
          <Result status="success" title="Submission Complete" subTitle="Your request has been processed." />
          <Result status="warning" title="Partial Data" subTitle="Some records could not be loaded." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Result status="info" title="Small size" subTitle="Compact variant for inline use." size="small" />
          <Result status="empty" title="Placeholder Container" subTitle="Dashed border treatment for drop zones." placeholderContainer size="small" />
        </div>
      </div>
    </ComponentDemo>
  );
}

/* ---------- New Components (v2) ---------- */

function SiteBannerDemo() {
  return (
    <ComponentDemo
      name="SiteBanner"
      description="Full-width site identifier bar above the navbar. Dark by default, with optional logo and expandable section. Activated via NEXT_PUBLIC_ENABLE_SITE_BANNER env var."
      props={`interface SiteBannerProps {
  orgName: string;
  logo?: string | ReactNode;
  orgNameElement?: ReactNode;
  statement?: string;
  learnMoreLabel?: string;
  learnMoreContent?: ReactNode;
  variant?: 'dark' | 'light';
  className?: string;
}`}
    >
      <div className="space-y-6 -mx-6">
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3 px-6">Dark with logo (default)</Text>
          <SiteBanner
            orgName="CITY of BOSTON"
            logo="/demo-logo-boston.png"
            learnMoreContent={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <span className="opacity-70">A .gov website belongs to an official government organization.</span>
                </div>
                <div className="flex gap-2">
                  <span className="opacity-70">A lock icon means you&apos;ve safely connected to the .gov website.</span>
                </div>
              </div>
            }
          />
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3 px-6">Light variant</Text>
          <SiteBanner
            orgName="STATE of CALIFORNIA"
            variant="light"
            learnMoreContent={
              <p>This is an official website of the State of California.</p>
            }
          />
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3 px-6">Minimal (no logo, no expandable)</Text>
          <SiteBanner orgName="COUNTY of MIAMI-DADE" />
        </div>
        <div>
          <Text size="sm" weight="medium" color="muted" className="mb-3 px-6">Custom orgNameElement override</Text>
          <SiteBanner
            orgName="Acme Corp"
            orgNameElement={
              <span className="inline-flex items-center gap-1.5 font-bold tracking-wide">
                <span className="text-yellow-300">★</span> ACME CORP
              </span>
            }
            statement="Your trusted partner in innovation."
          />
        </div>
      </div>
    </ComponentDemo>
  );
}

function BannerDemo() {
  return (
    <ComponentDemo
      name="Banner"
      description="Full-width dismissible banner with 5 semantic variants."
      props={`interface BannerProps {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  title?: string; children?: ReactNode;
  dismissible?: boolean; onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}`}
    >
      <div className="space-y-3">
        <Banner variant="info" title="System Update" dismissible>New features are available. Refresh to see changes.</Banner>
        <Banner variant="success" title="Deployment Complete">All services are running normally.</Banner>
        <Banner variant="warning" title="Maintenance Window">Scheduled downtime tonight 10pm–2am.</Banner>
        <Banner variant="error" title="Service Disruption">API latency is elevated. Investigating.</Banner>
        <Banner variant="neutral" title="Tip" action={{ label: 'Learn More', onClick: () => {} }}>You can customize the theme in config/app.config.ts.</Banner>
      </div>
    </ComponentDemo>
  );
}

function HeroDemo() {
  return (
    <ComponentDemo
      name="Hero"
      description="Page hero with title, subtitle, CTAs, optional illustration, and background image with overlay."
      props={`interface HeroProps {
  title: string; subtitle?: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  illustration?: ReactNode;
  align?: 'left' | 'center';
  variant?: 'default' | 'gradient' | 'image';
  backgroundImage?: string;
  backgroundFit?: 'cover' | 'contain';
  backgroundPosition?: 'top' | 'center' | 'bottom';
  overlay?: boolean | 'gradient' | 'brand' | string;
}`}
    >
      <div className="space-y-6">
        <Hero
          title="Build Government Apps Fast"
          subtitle="The atomic foundation for AI-generated applications."
          primaryAction={{ label: 'Get Started', href: '#' }}
          secondaryAction={{ label: 'Documentation', href: '#' }}
          variant="gradient"
        />
        <Hero
          title="Centered Hero"
          subtitle="Centered alignment without illustration."
          primaryAction={{ label: 'Action', href: '#' }}
          align="center"
        />
        <Hero
          title="Image + Brand Overlay"
          subtitle="Diagonal primary-color gradient — theme-aware, adapts to light/dark mode."
          primaryAction={{ label: 'Get Started', href: '#' }}
          secondaryAction={{ label: 'Learn More', href: '#' }}
          variant="image"
          backgroundImage="/brand/demo-bg-boston.jpg"
          backgroundPosition="top"
          overlay="brand"
        />
        <Hero
          title="Image + Gradient Overlay"
          subtitle="Left-to-right dark fade — dark where text is, transparent on the right."
          primaryAction={{ label: 'Get Started', href: '#' }}
          secondaryAction={{ label: 'Learn More', href: '#' }}
          variant="image"
          backgroundImage="/brand/demo-bg-boston.jpg"
          backgroundPosition="top"
          overlay="gradient"
        />
        <Hero
          title="Image + Solid Overlay"
          subtitle="Uniform dark overlay for maximum text contrast."
          primaryAction={{ label: 'Get Started', href: '#' }}
          secondaryAction={{ label: 'Learn More', href: '#' }}
          variant="image"
          backgroundImage="/brand/demo-bg-boston.jpg"
          backgroundPosition="top"
          overlay
        />
      </div>
    </ComponentDemo>
  );
}

function SummaryCardDemo() {
  return (
    <ComponentDemo
      name="SummaryCard"
      description="Summary card with badge/footer slots, optional icon, href support, and feature variant with highlighted icon treatment."
      props={`interface SummaryCardProps {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  icon?: ElementType;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'feature';
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="space-y-6">
        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">Default variant</Text>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Infrastructure Improvement Program FY2025"
            description="PRJ-25-MC-06-0001"
            footer={<span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />Due: 12 days</span>}
            badge={<Chip label="Medium" color="warning" size="sm" />}
          />
          <SummaryCard
            title="Public Safety Hiring Program FY2024"
            description="2024-UL-WX-0012"
            footer={<span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />Due: 8 days</span>}
            badge={<Chip label="High" color="danger" size="sm" />}
          />
          <SummaryCard
            title="Environmental Assessment Project"
            description="ENV-00E03421-0"
            icon={FileText}
            size="sm"
            badge={<Badge variant="success" size="sm" shape="pill">Submitted</Badge>}
          />
        </div>
        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">Feature variant (merged from FeatureCard)</Text>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard variant="feature" icon={Blocks} title="Atomic Design" description="Atoms, molecules, and organisms compose every view." href="#" />
          <SummaryCard variant="feature" icon={Shield} title="Auth Guards" description="Middleware-based route protection with role support." badge="New" />
          <SummaryCard variant="feature" icon={Palette} title="HSL Theming" description="One hex value cascades to the entire shade scale." />
        </div>
      </div>
    </ComponentDemo>
  );
}

function FilePreviewCardDemo() {
  return (
    <ComponentDemo
      name="FilePreviewCard"
      description="File card with preview, progress bar, and action buttons."
      props={`interface FilePreviewCardProps {
  name: string; description?: string;
  layout?: 'horizontal' | 'vertical';
  previewSrc?: string; previewIcon?: ReactNode;
  progress?: number; isSelected?: boolean;
  onActionClick?: () => void; onClick?: () => void; onClose?: () => void;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <FilePreviewCard
          name="Q1-Budget-Report.pdf"
          description="2.4 MB · PDF"
          onActionClick={() => {}}
          onClose={() => {}}
        />
        <FilePreviewCard
          name="Site-Photo.jpg"
          description="Uploading..."
          previewIcon={<Image className="h-8 w-8" />}
          progress={65}
          onClose={() => {}}
        />
        <FilePreviewCard
          name="Selected File"
          description="This card is selected"
          previewIcon={<File className="h-8 w-8" />}
          isSelected
          onClick={() => {}}
        />
        <FilePreviewCard
          name="Vertical Layout"
          description="Uses layout='vertical'"
          layout="vertical"
          previewIcon={<File className="h-8 w-8" />}
          onActionClick={() => {}}
          onClose={() => {}}
        />
      </div>
    </ComponentDemo>
  );
}

function CheckboxTreeDemo() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <ComponentDemo
      name="CheckboxTree"
      description="Hierarchical tree with tri-state checkboxes. Parent cascades to children."
      props={`interface CheckboxTreeProps {
  items: TreeNode[]; selected: string[];
  onSelectionChange: (selected: string[]) => void;
  expandedByDefault?: boolean;
}
interface TreeNode { id: string; label: string; children?: TreeNode[]; disabled?: boolean; }`}
    >
      <div className="max-w-sm space-y-2">
        <CheckboxTree
          items={[
            {
              id: 'dept',
              label: 'All Departments',
              children: [
                { id: 'eng', label: 'Engineering', children: [
                  { id: 'fe', label: 'Frontend' },
                  { id: 'be', label: 'Backend' },
                  { id: 'devops', label: 'DevOps' },
                ] },
                { id: 'design', label: 'Design' },
                { id: 'product', label: 'Product', disabled: true },
              ],
            },
          ]}
          selected={selected}
          onSelectionChange={setSelected}
          expandedByDefault
        />
        <Text size="xs" color="muted">Selected: {selected.length > 0 ? selected.join(', ') : 'none'}</Text>
      </div>
    </ComponentDemo>
  );
}

/* ---------- Wizard Components ---------- */

function WizardCardDemo() {
  return (
    <ComponentDemo
      name="WizardCard"
      description="Elevated content card for fullscreen wizard steps with header, content, actions, and optional footer."
      props={`interface WizardCardProps {
  stepLabel?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}`}
    >
      <div className="max-w-[570px]">
        <WizardCard
          stepLabel="Step 1 of 4"
          title="Hi Alex, let's get you set up"
          description="What best describes your role?"
          actions={<Button className="w-full">Continue</Button>}
          footer={<Text size="sm" color="muted">Have questions? Contact your administrator or call our support team.</Text>}
        >
          <div className="space-y-3">
            <div className="border border-primary bg-primary-light rounded p-4">
              <Text weight="semibold">Program Administrator</Text>
              <Text size="xs" color="muted">I manage day-to-day compliance and reporting.</Text>
            </div>
            <div className="border border-border rounded p-4">
              <Text weight="semibold">Finance Director</Text>
              <Text size="xs" color="muted">I oversee budgets and financial compliance.</Text>
            </div>
          </div>
        </WizardCard>
      </div>
    </ComponentDemo>
  );
}

function CollapsibleTableDemo() {
  const columns: CollapsibleTableColumn[] = [
    { key: 'field', label: 'Field' },
    { key: 'value', label: 'Value' },
  ];

  const detailRows: CollapsibleTableRow[] = [
    { cells: { field: 'Program Name', value: 'Community Development Block Grant (CDBG)' } },
    { cells: { field: 'Reference Number', value: '14.218' } },
    { cells: { field: 'Total Amount', value: '$1,250,000' } },
    { cells: { field: 'Performance Period', value: 'Needs Review' }, alert: { icon: <AlertTriangle className="h-3.5 w-3.5 text-warning" />, className: 'bg-warning-light' } },
  ];

  const budgetColumns: CollapsibleTableColumn[] = [
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', align: 'right' },
  ];

  const budgetRows: CollapsibleTableRow[] = [
    { cells: { category: 'Personnel', amount: '$450,000' } },
    { cells: { category: 'Contractual', amount: '$320,000' } },
    { cells: { category: 'Equipment', amount: '$80,000' }, alert: { icon: <AlertTriangle className="h-3.5 w-3.5 text-warning" />, className: 'bg-warning-light' } },
  ];

  return (
    <ComponentDemo
      name="CollapsibleTable"
      description="Collapsible data section with configurable columns, alert rows, and optional extra columns with custom renderers."
      props={`interface CollapsibleTableProps {
  title: ReactNode;
  columns: CollapsibleTableColumn[];
  rows: CollapsibleTableRow[];
  extraColumns?: CollapsibleTableExtraColumn[];
  defaultOpen?: boolean;
}
interface CollapsibleTableColumn { key: string; label: string; align?: 'left' | 'center' | 'right'; }
interface CollapsibleTableRow { cells: Record<string, string | number | ReactNode>; alert?: { icon?: ReactNode; className?: string }; }`}
    >
      <div className="space-y-4 max-w-2xl">
        <CollapsibleTable title="Program Details" columns={columns} rows={detailRows} />
        <CollapsibleTable title="Budget Categories" columns={budgetColumns} rows={budgetRows} defaultOpen={false} />
      </div>
    </ComponentDemo>
  );
}

function UploadSlotDemo() {
  return (
    <ComponentDemo
      name="UploadSlot"
      description="Document upload slot with empty (upload button) and filled (file card with delete) states."
      props={`interface UploadSlotProps {
  label: string;
  file?: { title: string; filename: string; dueDate?: string };
  onUpload?: () => void;
  onDelete?: () => void;
}`}
    >
      <div className="space-y-6 max-w-md">
        <UploadSlot label="Quarter 1" onUpload={() => {}} />
        <UploadSlot
          label="Quarter 2"
          file={{
            title: 'Federal Financial Report (SF-425)',
            filename: 'sf-report-425-q2.docx',
            dueDate: 'Due: Jul 30, 2026',
          }}
          onDelete={() => {}}
        />
        <UploadSlot label="Quarter 3" onUpload={() => {}} />
      </div>
    </ComponentDemo>
  );
}

function StatusChecklistDemo() {
  return (
    <ComponentDemo
      name="StatusChecklist"
      description="Vertical checklist wrapping StatusStep atoms for async workflow operations."
      props={`interface StatusChecklistProps {
  steps: StatusChecklistStep[];
}
interface StatusChecklistStep {
  label: ReactNode;
  status: 'completed' | 'in-progress' | 'pending';
}`}
    >
      <div className="max-w-sm">
        <StatusChecklist
          steps={[
            { label: 'Confirm program details', status: 'completed' },
            { label: 'Map budget categories', status: 'completed' },
            { label: 'Check compliance conditions', status: 'in-progress' },
            { label: 'Set reporting deadlines', status: 'pending' },
          ]}
        />
      </div>
    </ComponentDemo>
  );
}

/* ---------- Domain Components ---------- */

function SectionHeaderDemo() {
  return (
    <ComponentDemo
      name="SectionHeader"
      description="Semantic heading + description + optional right-aligned action. Supports heading level (as) and CVA size."
      props={`interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  as?: 'h2' | 'h3' | 'h4';
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="space-y-6">
        <SectionHeader title="Default (h3 / md)" description="4 items need attention" />
        <SectionHeader as="h2" size="lg" title="Large (h2 / lg)" description="Top-level section heading" action={<Button variant="outline" size="sm">View All</Button>} />
        <SectionHeader as="h4" size="sm" title="Small (h4 / sm)" description="Compact sub-section" />
      </div>
    </ComponentDemo>
  );
}

function InfoCardDemo() {
  return (
    <ComponentDemo
      name="InfoCard"
      description="Callout card with icon/badge, description, action buttons, and children slot. Supports default and highlighted variants."
      props={`interface InfoCardProps {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  icon?: ElementType | ReactNode;
  actions?: ComponentAction[];
  children?: ReactNode;
  variant?: 'default' | 'highlighted';
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="space-y-4 max-w-xl">
        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">Default variant</Text>
        <InfoCard
          title="Budget at 91% utilization"
          description="Contractual: $45,500 of $50,000 spent"
          badge={<Badge variant="danger" size="sm" shape="pill">Critical</Badge>}
          actions={[{ label: 'Manage Budget' }]}
        />
        <InfoCard
          title="Burn rate below pace"
          description="68% of period elapsed · 29% of $4.2M spent"
          badge={<Badge variant="warning" size="sm" shape="pill">Warning</Badge>}
          actions={[{ label: 'Review' }]}
        />
        <InfoCard
          title="New policy update available"
          description="Review the latest compliance guidelines."
          icon={Info}
          size="sm"
        />

        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">Highlighted variant</Text>
        <InfoCard
          title="Consulting Contract – Apex Group"
          description="Coded to Supplies but description matches Contractual"
          icon={Sparkles}
          variant="highlighted"
          actions={[{ label: 'Review' }]}
        />
        <InfoCard
          title="Drawdown #5 pending 37 days"
          description="$12,300 submitted Oct 5 – no status update."
          icon={<StatusDot color="primary" size="md" />}
          variant="highlighted"
          actions={[{ label: 'Follow Up' }]}
        />
        <InfoCard
          title="Deadline approaching"
          description="Only 5 days remaining to submit the quarterly report."
          icon={<StatusDot color="warning" size="md" />}
          variant="default"
          size="sm"
        />
      </div>
    </ComponentDemo>
  );
}

function ValueItemDemo() {
  return (
    <ComponentDemo
      name="ValueItem"
      description="Value display with amount, title, description, actions, tag, timestamp, and meta slot. Supports card and row layouts."
      props={`interface ValueItemProps {
  value: ReactNode;
  valueColor?: 'danger' | 'success' | 'warning' | 'muted' | 'primary';
  title: ReactNode;
  description?: ReactNode;
  actions?: ComponentAction[];
  meta?: ReactNode;
  tag?: ReactNode;
  tagColor?: ChipColor;
  timestamp?: ReactNode;
  layout?: 'card' | 'row';
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="space-y-6 max-w-xl">
        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">Card layout (default)</Text>
        <div className="space-y-3">
          <ValueItem
            value="-$8,400.00"
            valueColor="danger"
            title="Habitat for Humanity"
            description="Block Grant Program · Apr 11"
            actions={[{ label: 'Approve' }, { label: 'Review' }]}
            meta={
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-medium text-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />2 days waiting
              </span>
            }
          />
          <ValueItem
            value="+$5,000.00"
            valueColor="success"
            title="Reimbursement received"
            description="Housing Program · Apr 8"
            size="sm"
          />
        </div>

        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">Row layout (activity feed style)</Text>
        <div className="rounded border border-border bg-card p-4">
          <ValueItem
            layout="row"
            value="-$10,416.16"
            valueColor="danger"
            title="System (FIN Sync)"
            description="City Payroll – March 2026"
            tag="Personnel"
            tagColor="primary"
            timestamp="10/24/26"
          />
          <ValueItem
            layout="row"
            value="+$5,000.00"
            valueColor="success"
            title="Drawdown Processed"
            description="Reimbursement – March 2026"
            tag="Travel"
            tagColor="warning"
            timestamp="10/24/26"
          />
          <ValueItem
            layout="row"
            value="$1,200.00"
            valueColor="muted"
            title="Pending Review"
            description="Equipment purchase – Feb 2026"
            tag="Equipment"
            tagColor="info"
            timestamp="09/15/26"
          />
        </div>
      </div>
    </ComponentDemo>
  );
}

function DeadlineItemDemo() {
  return (
    <ComponentDemo
      name="DeadlineItem"
      description="Deadline row with countdown badge (or custom leading slot), title, description, and action via ComponentAction."
      props={`interface DeadlineItemProps {
  month: string;
  daysRemaining: number;
  title: ReactNode;
  description?: ReactNode;
  badgeVariant?: StatBadgeProps['variant'];
  leading?: ReactNode;
  action?: ComponentAction;
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="space-y-3 max-w-xl">
        <DeadlineItem month="APR" daysRemaining={6} title="SF-425 Q1 Report" description="Due Apr 19 · Submit via portal" action={{ label: 'Start' }} />
        <DeadlineItem month="APR" daysRemaining={8} title="Progress Report Q1" description="Due Apr 21 · Submit via system" badgeVariant="warning" action={{ label: 'Start' }} />
        <DeadlineItem month="MAY" daysRemaining={30} title="Annual Performance Report" description="Due May 30" badgeVariant="success" />
      </div>
    </ComponentDemo>
  );
}

function BreakdownCardDemo() {
  return (
    <ComponentDemo
      name="BreakdownCard"
      description="Segmented breakdown card with threshold progress bar and key-value detail footer. All values pre-formatted."
      props={`interface BreakdownCardProps {
  title: ReactNode;
  description?: ReactNode;
  segments: Array<{ label: string; value: string; sublabel?: string }>;
  progressValue?: number;
  progressColor?: ThresholdProgressProps['color'];
  progressThresholds?: { warning: number; danger: number };
  details?: Array<{ label: string; value: string }>;
  action?: { label: string; href?: string; onClick?: () => void };
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="max-w-lg">
        <BreakdownCard
          title="Budget Summary"
          description="Total Award: $847k"
          segments={[
            { label: 'Expended', value: '$387,250', sublabel: '46%' },
            { label: 'Remaining', value: '$460,250', sublabel: '54%' },
          ]}
          progressValue={46}
          progressThresholds={{ warning: 75, danger: 90 }}
          details={[
            { label: 'Period Start', value: 'Oct 1, 2024' },
            { label: 'Period End', value: 'Sep 30, 2026' },
            { label: 'Days Remaining', value: '543' },
          ]}
          action={{ label: 'View Budget Detail' }}
        />
      </div>
    </ComponentDemo>
  );
}

function ExpandableListItemDemo() {
  return (
    <ComponentDemo
      name="ExpandableListItem"
      description="Expandable row with status badge, generic sections, and action buttons."
      props={`interface ExpandableListItemProps {
  title: ReactNode;
  description?: ReactNode;
  status: { label: string; variant: BadgeVariant };
  sections?: ExpandableListItemSection[];
  actions?: ComponentAction[];
  defaultExpanded?: boolean;
}
interface ExpandableListItemSection { label: ReactNode; content: ReactNode; }`}
    >
      <div className="max-w-lg">
        <ExpandableListItem
          title="Environmental Review (24 CFR Part 58)"
          description="Due before committing funds"
          status={{ label: 'Met', variant: 'success' }}
          sections={[
            { label: 'Evidence', content: <a href="#" className="text-primary text-xs hover:underline">RROF submitted 02/14/2026</a> },
            { label: 'Notes', content: 'Covered all FY26 activities under single Tiered Review.' },
          ]}
          defaultExpanded
        />
        <ExpandableListItem
          title="Section 3 Plan (Economic Opportunities)"
          description="Due before procurement > $200k"
          status={{ label: 'In Progress', variant: 'inProgress' }}
          actions={[{ label: 'Upload Evidence', variant: 'outline' }]}
        />
        <ExpandableListItem
          title="Davis-Bacon Wage Rates"
          description="Due ongoing (construction > $2k)"
          status={{ label: 'N/A', variant: 'default' }}
        />
      </div>
    </ComponentDemo>
  );
}

function ComposeInputDemo() {
  return (
    <ComponentDemo
      name="ComposeInput"
      description="Compose input with avatar, text field, submit button, optional media types and footer. Supports compact variant."
      props={`interface ComposeInputProps {
  avatar?: { src?: string; fallback?: string };
  placeholder?: string;
  onSubmit?: (content: string) => void;
  submitLabel?: ReactNode;
  mediaTypes?: Array<{ label: string; icon: ElementType }>;
  footer?: ReactNode;
  variant?: 'default' | 'compact';
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="space-y-4 max-w-lg">
        <ComposeInput avatar={{ fallback: 'S' }} submitLabel="Post" />
        <ComposeInput avatar={{ fallback: 'S' }} variant="compact" size="sm" placeholder="Quick note..." submitLabel="Send" />
      </div>
    </ComponentDemo>
  );
}

/* ---------- Layout (new) ---------- */

function PageContentDemo() {
  return (
    <ComponentDemo
      name="PageContent"
      description="Standardized page-level wrapper with max-width, padding, and gap variants via CVA."
      props={`interface PageContentProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}`}
    >
      <div className="space-y-4">
        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">maxWidth=&quot;lg&quot;, padding=&quot;md&quot;, gap=&quot;md&quot;</Text>
        <div className="border border-dashed border-border rounded">
          <PageContent maxWidth="lg" padding="md" gap="md">
            <div className="bg-primary-light rounded px-4 py-2 text-sm text-foreground">Section 1</div>
            <div className="bg-primary-light rounded px-4 py-2 text-sm text-foreground">Section 2</div>
            <div className="bg-primary-light rounded px-4 py-2 text-sm text-foreground">Section 3</div>
          </PageContent>
        </div>
        <Text size="xs" weight="semibold" color="muted" className="uppercase tracking-wider">maxWidth=&quot;sm&quot;, padding=&quot;lg&quot;, gap=&quot;lg&quot;</Text>
        <div className="border border-dashed border-border rounded">
          <PageContent maxWidth="sm" padding="lg" gap="lg">
            <div className="bg-muted rounded px-4 py-2 text-sm text-foreground">Narrow content</div>
            <div className="bg-muted rounded px-4 py-2 text-sm text-foreground">With more spacing</div>
          </PageContent>
        </div>
      </div>
    </ComponentDemo>
  );
}

function ResponsiveGridDemo() {
  return (
    <ComponentDemo
      name="ResponsiveGrid"
      description="Responsive CSS grid with configurable columns per breakpoint."
      props={`interface ResponsiveGridProps {
  columns?: { default?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: 'sm' | 'md' | 'lg';
  as?: ElementType;
  children: ReactNode;
  className?: string;
  maxWidth?: string; // e.g. "1440px" — constrains grid width and centers it
}`}
    >
      <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 4 }} gap="md">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-primary-light border border-primary/20 rounded px-3 py-2 text-sm text-center">
            Item {i + 1}
          </div>
        ))}
      </ResponsiveGrid>

      <p className="text-sm text-muted-foreground mt-4 mb-2">With <code>maxWidth=&quot;600px&quot;</code>:</p>
      <ResponsiveGrid columns={{ default: 1, sm: 2, lg: 4 }} gap="md" maxWidth="600px">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-primary-light border border-primary/20 rounded px-3 py-2 text-sm text-center">
            Item {i + 1}
          </div>
        ))}
      </ResponsiveGrid>
    </ComponentDemo>
  );
}

/* ---------- Interactive Inputs ---------- */

function AddressInputDemo() {
  const [value, setValue] = useState('');
  const [suggestions] = useState([
    { id: '1', label: '123 Main St, Springfield, IL 62704', sublabel: 'Springfield, Illinois' },
    { id: '2', label: '456 Oak Ave, Springfield, MO 65804', sublabel: 'Springfield, Missouri' },
    { id: '3', label: '789 Elm Blvd, Springfield, MA 01103', sublabel: 'Springfield, Massachusetts' },
  ]);
  return (
    <ComponentDemo
      name="AddressInput"
      description="Provider-agnostic address autocomplete with WAI-ARIA combobox pattern. Parent handles geocoding."
      props={`interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: GeocodedLocation) => void;
  suggestions?: AddressSuggestion[];
  onSearch?: (query: string) => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
}`}
    >
      <div className="max-w-md space-y-2">
        <AddressInput
          value={value}
          onChange={setValue}
          onSelect={(loc) => setValue(loc.address)}
          suggestions={value.length >= 2 ? suggestions : []}
          placeholder="Type to search addresses..."
        />
        <AddressInput value="" onChange={() => {}} onSelect={() => {}} error="Address is required" placeholder="With error state" />
      </div>
    </ComponentDemo>
  );
}

function MentionInputDemo() {
  const [value, setValue] = useState('');
  return (
    <ComponentDemo
      name="MentionInput"
      description="Textarea with @mention support. Triggers dropdown on typing '@', inserts mention tokens."
      props={`interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  mentionables: Mentionable[];
  trigger?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}`}
    >
      <div className="max-w-md space-y-2">
        <MentionInput
          value={value}
          onChange={setValue}
          mentionables={[
            { id: '1', label: 'Jane Smith', sublabel: 'Engineering', avatar: { fallback: 'JS' } },
            { id: '2', label: 'Bob Johnson', sublabel: 'Design', avatar: { fallback: 'BJ' } },
            { id: '3', label: 'Alice Chen', sublabel: 'Product', avatar: { fallback: 'AC' } },
          ]}
          placeholder="Type @ to mention someone..."
          maxLength={280}
        />
        <Text size="xs" color="muted">Value: &quot;{value}&quot;</Text>
      </div>
    </ComponentDemo>
  );
}

function CategoryGridDemo() {
  const [selected, setSelected] = useState('');
  return (
    <ComponentDemo
      name="CategoryGrid"
      description="Selectable card grid for choosing categories. Uses role='radiogroup' with keyboard arrow navigation."
      props={`interface CategoryGridProps {
  items: CategoryItem[];
  selected?: string;
  onSelect?: (id: string) => void;
  columns?: { default?: number; sm?: number; lg?: number };
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <CategoryGrid
        items={[
          { id: 'roads', icon: Car, label: 'Roads & Traffic', description: 'Potholes, signals, signs' },
          { id: 'water', icon: Droplets, label: 'Water & Sewer', description: 'Leaks, drainage, flooding' },
          { id: 'parks', icon: TreePine, label: 'Parks & Recreation', description: 'Maintenance, facilities' },
          { id: 'buildings', icon: Building2, label: 'Buildings', description: 'Code violations, permits' },
          { id: 'power', icon: Zap, label: 'Utilities', description: 'Power outages, streetlights' },
          { id: 'other', icon: MapPin, label: 'Other', description: 'General requests', disabled: true },
        ]}
        selected={selected}
        onSelect={setSelected}
        columns={{ default: 2, sm: 3, lg: 3 }}
      />
    </ComponentDemo>
  );
}

/* ---------- Feed & Widgets ---------- */

function ActivityFeedDemo() {
  return (
    <ComponentDemo
      name="ActivityFeed"
      description="Vertical activity feed with icon/avatar column, connecting lines, and variant-based styling."
      props={`interface ActivityFeedProps {
  items: ActivityItem[];
  size?: 'sm' | 'md' | 'lg';
  emptyMessage?: ReactNode;
  renderItem?: (item: ActivityItem, index: number) => ReactNode;
}

type ActivityVariant = 'comment' | 'status' | 'assignment' | 'system' | 'note';`}
    >
      <div className="max-w-lg">
        <ActivityFeed
          items={[
            { id: '1', variant: 'comment', title: 'Jane Smith commented', description: 'Looks good, approved for next phase.', timestamp: '2 hours ago', avatar: { fallback: 'JS' } },
            { id: '2', variant: 'status', title: 'Status changed to In Progress', description: 'Moved from "Pending Review" to "In Progress"', timestamp: '5 hours ago' },
            { id: '3', variant: 'assignment', title: 'Assigned to Bob Johnson', description: 'Transferred from the general queue.', timestamp: 'Yesterday' },
            { id: '4', variant: 'system', title: 'Request created', description: 'Submitted via citizen portal.', timestamp: '2 days ago' },
            { id: '5', variant: 'note', title: 'Internal note added', description: 'Follow up with contractor about timeline.', timestamp: '3 days ago' },
          ]}
        />
      </div>
    </ComponentDemo>
  );
}

function DashboardWidgetDemo() {
  return (
    <ComponentDemo
      name="DashboardWidget"
      description="Standardized card wrapper for dashboard widgets with header, loading skeleton, and empty state."
      props={`interface DashboardWidgetProps {
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; onClick?: () => void; href?: string };
  loading?: boolean;
  empty?: ReactNode;
  children: ReactNode;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashboardWidget title="Recent Activity" action={{ label: 'View All', href: '#' }}>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>3 new requests submitted</p>
            <p>2 requests resolved</p>
            <p>1 request escalated</p>
          </div>
        </DashboardWidget>
        <DashboardWidget title="Loading Widget" loading>
          <p>This content is hidden during loading</p>
        </DashboardWidget>
      </div>
    </ComponentDemo>
  );
}

function LabeledProgressRowDemo() {
  return (
    <ComponentDemo
      name="LabeledProgressRow"
      description="Labeled row with threshold progress bar, configurable label width, color, icon, and CVA size."
      props={`interface LabeledProgressRowProps {
  label: ReactNode;
  value: number;
  color?: ThresholdProgressProps['color'];
  icon?: ElementType;
  labelWidth?: string;
  size?: 'sm' | 'md' | 'lg';
}`}
    >
      <div className="rounded border border-border bg-card p-4 max-w-md">
        <LabeledProgressRow label="Participant 1" value={50} />
        <LabeledProgressRow label="Participant 2" value={50} />
        <LabeledProgressRow label="Participant 3" value={13} icon={AlertTriangle} />
        <LabeledProgressRow label="Participant 4" value={75} />
      </div>
    </ComponentDemo>
  );
}
