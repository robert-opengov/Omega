'use client';

import { useState } from 'react';
import {
  Inbox, Search, Home, Users, Settings, Plus, Trash2,
  FileText, MoreHorizontal,
  Bell, CheckCircle, Info, Star, Archive, Copy,
  AlertTriangle, Clock, Mail, Filter, MapPin, Blocks, Shield, Palette, File, Image,
} from 'lucide-react';
import { ShowcaseLayout } from '../_components/ShowcaseLayout';
import { z } from 'zod';
import {
  Button,
  Text,
  Badge,
} from '@/components/ui/atoms';
import {
  Card, CardContent, CardHeader, CardTitle, CardSubtitle, CardDescription, CardFooter, CardInfo, CardMedia,
  FormField,
  SearchInput,
  DataTable, type Column,
  StatsCard,
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
  Timeline, TimelineItem, TimelineDot, TimelineConnector, TimelineContent,
  Toolbar,
  Result,
  OnboardingWizard,
  Banner,
  Hero,
  FeatureCard,
  FilePreviewCard,
  CheckboxTree,
} from '@/components/ui/molecules';
import { useToast } from '@/providers/toast-provider';
import { ComponentDemo, Section } from '../_components/ComponentDemo';

export default function MoleculesPage() {
  return (
    <ShowcaseLayout>
      <div className="space-y-12">

      <Section title="Layout" count={4}>
        <CardDemo />
        <PageHeaderDemo />
        <BreadcrumbsDemo />
        <EmptyStateDemo />
      </Section>

      <Section title="Data Display" count={4}>
        <DataTableDemo />
        <StatsCardDemo />
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

      <Section title="Parity Components" count={5}>
        <ListDemo />
        <LabelValuePairDemo />
        <TimelineDemo />
        <ToolbarDemo />
        <ResultDemo />
      </Section>

      <Section title="Content Components" count={5} description="Heroes, banners, file previews, and hierarchical selection.">
        <BannerDemo />
        <HeroDemo />
        <FeatureCardDemo />
        <FilePreviewCardDemo />
        <CheckboxTreeDemo />
      </Section>
      </div>
    </ShowcaseLayout>
  );
}

/* ---------- Layout ---------- */

function CardDemo() {
  return (
    <ComponentDemo
      name="Card"
      description="Flexible slot-based container. Every sub-component is optional — use only what you need."
      props={`interface CardProps { variant?: 'default' | 'outlined' | 'elevated'; }

Sub-components (all optional):
  CardMedia      — image/map/video at the top (src or children)
  CardHeader     — wrapper; action prop adds a top-right slot
  CardSubtitle   — small uppercase label above or below title
  CardTitle      — heading (h2/h3/h4)
  CardDescription — muted paragraph
  CardInfo       — icon with tooltip (designed for CardHeader action)
  CardContent    — main body
  CardFooter     — bottom row with flex gap for buttons`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Worst case: all slots filled */}
        <Card>
          <CardMedia src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=300&fit=crop" alt="City skyline" />
          <CardHeader action={<CardInfo content="Infrastructure request submitted by a citizen via the 311 portal." />}>
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

        {/* Mid complexity: title + info + content + actions */}
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

        {/* Simplest case: title + description only */}
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
  breadcrumbs?: { title: string; href?: string }[];
  stats?: { label: string; value: string; icon?: 'up' | 'down' | 'flat' }[];
  status?: { label: string; variant?: string }[];
  titleSize?: 'large' | 'small'; condensed?: boolean;
}`}
    >
      <div className="space-y-8">
        <PageHeader
          title="Service Requests"
          description="Manage all incoming citizen requests"
          breadcrumbs={[{ title: 'Home', href: '#' }, { title: 'Requests' }]}
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
      description="Sortable table with optional pagination and search."
      props={`interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  pageSize?: number;
  search?: boolean;
  tableLabel?: string;
  className?: string;
}`}
    >
      <DataTable
        data={sampleTableData}
        columns={tableColumns}
        keyExtractor={(r) => r.id}
        search
        pagination
        pageSize={3}
        tableLabel="Users table"
      />
    </ComponentDemo>
  );
}

function StatsCardDemo() {
  return (
    <ComponentDemo
      name="StatsCard"
      description="Metric card with trend indicator and optional icon."
      props={`interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ElementType;
  className?: string;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Users" value="1,284" change={12.5} changeLabel="vs last month" icon={Users} />
        <StatsCard title="Open Requests" value={42} change={-8.3} changeLabel="vs last week" icon={FileText} />
        <StatsCard title="Resolution Rate" value="94%" icon={CheckCircle} />
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
  return (
    <ComponentDemo
      name="Sheet"
      description="Slide-over panel from left, right, or bottom."
      props={`interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  side?: 'left' | 'right' | 'bottom';
  className?: string;
}`}
    >
      <div className="flex gap-2">
        {(['left', 'right', 'bottom'] as const).map((s) => (
          <Button key={s} variant="outline" size="sm" onClick={() => { setSide(s); setOpen(true); }}>
            Sheet ({s})
          </Button>
        ))}
      </div>
      <Sheet open={open} onOpenChange={setOpen} side={side} title={`Sheet — ${side}`} description="Slide-over panel content.">
        <div className="p-4 space-y-4">
          <Text>This panel slides from the {side}.</Text>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
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

function TimelineDemo() {
  return (
    <ComponentDemo
      name="Timeline"
      description="Vertical event timeline with colored dots and connectors."
      props={`Compound: Timeline, TimelineItem, TimelineDot, TimelineConnector, TimelineContent
Timeline: position?: 'left' | 'right' | 'alternate'
TimelineDot: icon?, color?, outlined?`}
    >
      <Timeline>
        <TimelineItem>
          <TimelineDot color="success" icon={CheckCircle} />
          <TimelineConnector />
          <TimelineContent>
            <Text weight="medium">Request Approved</Text>
            <Text size="xs" color="muted">March 15, 2026 — 2:30 PM</Text>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineDot color="info" icon={Clock} />
          <TimelineConnector />
          <TimelineContent>
            <Text weight="medium">Under Review</Text>
            <Text size="xs" color="muted">March 14, 2026 — 10:00 AM</Text>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineDot color="primary" icon={Mail} />
          <TimelineConnector />
          <TimelineContent>
            <Text weight="medium">Request Submitted</Text>
            <Text size="xs" color="muted">March 13, 2026 — 9:15 AM</Text>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
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
      description="Page hero with title, subtitle, CTAs, and optional illustration."
      props={`interface HeroProps {
  title: string; subtitle?: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  illustration?: ReactNode;
  align?: 'left' | 'center';
  variant?: 'default' | 'gradient' | 'image';
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
      </div>
    </ComponentDemo>
  );
}

function FeatureCardDemo() {
  return (
    <ComponentDemo
      name="FeatureCard"
      description="Icon + title + description card with optional link and badge."
      props={`interface FeatureCardProps {
  icon: ComponentType; title: string; description: string;
  href?: string; badge?: string;
}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FeatureCard icon={Blocks} title="Atomic Design" description="Atoms, molecules, and organisms compose every view." href="#" />
        <FeatureCard icon={Shield} title="Auth Guards" description="Middleware-based route protection with role support." badge="New" />
        <FeatureCard icon={Palette} title="HSL Theming" description="One hex value cascades to the entire shade scale." />
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
