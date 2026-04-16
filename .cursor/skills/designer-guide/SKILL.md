# Skill: Designer Contribution Guide

Guide for non-technical contributors (UX designers, product managers) using AI tools to compose pages in the GAB Boilerplate. You can build real pages without writing backend code — but you need to follow the rules to avoid breaking things.

## What You Can Do

### Create pages

You can create new pages inside `app/(dashboard)/`. Each page is a file. Creating a file creates a route:

```
app/(dashboard)/my-feature/page.tsx     → /my-feature
app/(dashboard)/my-feature/list/page.tsx → /my-feature/list
```

### Compose from existing components

The boilerplate has **114 pre-built components** organized by complexity:

- **Atoms** (33): Button, Input, Badge, Select, Switch, Checkbox, Avatar, Spinner...
- **Molecules** (57): Card, Modal, DataTable, FormField, MetricCard, Alert, Tabs, Hero...
- **Organisms** (21): Navbar, Sidebar, AuthForm, DataGrid, ChartCard, Timeline, KanbanBoard...
- **Layouts** (3): DashboardLayout, AuthLayout, WizardLayout

Your job is to **compose pages by combining these**, not to create new components.

### Create page-specific compositions

If a page needs a custom arrangement of components, create a `_components/` directory next to the page:

```
app/(dashboard)/my-feature/
├── page.tsx
└── _components/
    └── MyFeatureDashboard.tsx    # Your custom composition
```

### Add assets

You can add images, icons, and other static files to `public/`.

### Propose navigation changes

You can add entries to `config/navigation.config.ts` to make your page show up in the sidebar:

```typescript
{
  href: '/my-feature',
  label: 'My Feature',
  icon: FileText,        // from lucide-react
  featureFlag: 'enableMyFeature',  // optional
},
```

## What You Cannot Do

### Never edit `components/ui/`

This directory is the shared component library used by every GAB vertical. Changing a component here affects every fork and every page. If you need a change, open an issue describing what you need and why.

### Never install new packages

Do not run `npm install` to add UI libraries (MUI, Chakra, Ant, etc.), icon libraries, or styling tools. Everything you need is already installed. If you think something is missing, ask an engineer.

### Never add CSS files

No `.css` or `.scss` files. All styling is done with Tailwind CSS utility classes. Use the `cn()` helper for conditional classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn('p-4 rounded', isActive && 'bg-primary text-white')} />
```

### Never use inline styles

```typescript
// WRONG
<div style={{ backgroundColor: 'red', padding: '16px' }} />

// RIGHT
<div className="bg-destructive p-4" />
```

### Never copy a component to modify it

If a `Button` doesn't have the variant you need, don't copy `components/ui/atoms/Button.tsx` into your page folder and hack it. Use the existing props. If the props don't cover your case, open an issue.

## How to Find Components

### Step 1 — Browse the showcase

Start the dev server and visit http://localhost:3000/ui

Every component is rendered there with live interactive examples. Browse through:
- `/ui/atoms` — basic building blocks
- `/ui/molecules` — composed components
- `/ui/organisms` — complex feature components

### Step 2 — Understand the import pattern

All imports follow the same pattern:

```typescript
import { Button, Badge, Input } from '@/components/ui/atoms';
import { Card, DataTable, MetricCard, Alert } from '@/components/ui/molecules';
import { DataGrid, DetailPageHeader } from '@/components/ui/organisms';
import { DashboardLayout } from '@/components/ui/layouts';
```

### Step 3 — Check available props

Every component is typed with TypeScript. Your editor will show available props when you type `<ComponentName`. Common patterns:

```typescript
// Atoms have variant, size, and semantic props
<Button variant="primary" size="md" loading={false}>Submit</Button>
<Badge variant="success" size="sm">Active</Badge>
<Input error="Required field" inputSize="md" />

// Molecules accept data as props
<MetricCard title="Open Requests" value="142" description="across 5 departments" />
<Alert variant="warning" title="Deadline">Report due in 3 days</Alert>
<Card variant="elevated">
  <CardHeader><CardTitle>My Card</CardTitle></CardHeader>
  <CardContent>Content here</CardContent>
</Card>

// Organisms handle complex UI
<DataGrid data={items} columns={columns} searchable selectable pageSize={10} />
<DetailPageHeader title="Request #123" breadcrumbs={crumbs} tabs={tabs} />
```

## How to Build a Page (Step by Step)

### 1. Create the page file

```typescript
// app/(dashboard)/my-page/page.tsx
import { MyPageContent } from './_components/MyPageContent';

export default function MyPage() {
  return <MyPageContent />;
}
```

### 2. Create the client component

```typescript
// app/(dashboard)/my-page/_components/MyPageContent.tsx
'use client';

import { Button, Badge } from '@/components/ui/atoms';
import { Card, CardHeader, CardTitle, CardContent, MetricCard, Alert } from '@/components/ui/molecules';

export function MyPageContent() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-foreground">My Page</h1>

      <Alert variant="info" title="Welcome">
        This is a new page composed from existing components.
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total" value="42" />
        <MetricCard title="Active" value="28" />
        <MetricCard title="Pending" value="14" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Content goes here. Use Tailwind classes for spacing and typography.
          </p>
          <Button variant="primary" className="mt-4">Take Action</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Add to navigation (optional)

In `config/navigation.config.ts`:

```typescript
{ href: '/my-page', label: 'My Page', icon: FileText },
```

## Tailwind CSS Quick Reference

You don't need to know CSS. These Tailwind classes cover 90% of layout needs:

### Spacing

| Class | What it does |
|-------|-------------|
| `p-4` | Padding on all sides (16px) |
| `px-6` | Horizontal padding (24px) |
| `py-2` | Vertical padding (8px) |
| `mt-4` | Top margin (16px) |
| `mb-6` | Bottom margin (24px) |
| `space-y-4` | Vertical gap between children (16px) |
| `gap-4` | Grid/flex gap (16px) |

### Layout

| Class | What it does |
|-------|-------------|
| `flex` | Flexbox row |
| `flex-col` | Flexbox column |
| `grid grid-cols-3` | 3-column grid |
| `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | Responsive grid |
| `items-center` | Vertically center flex items |
| `justify-between` | Space items to edges |

### Typography

| Class | What it does |
|-------|-------------|
| `text-sm` | Small text |
| `text-lg` | Large text |
| `text-2xl` | Heading size |
| `font-semibold` | Semi-bold weight |
| `text-foreground` | Primary text color |
| `text-muted-foreground` | Secondary/muted text |

### Borders & Backgrounds

| Class | What it does |
|-------|-------------|
| `rounded` | Border radius |
| `border border-border` | Standard border |
| `bg-card` | Card background |
| `bg-muted` | Muted/subtle background |

## How to Request a Missing Component

If you need something that doesn't exist in the library:

1. Check `/ui` again — it might exist under a different name
2. Check if an existing component's props can achieve what you need (e.g., `Card` with `variant="elevated"`)
3. Open an issue on the boilerplate repository with:
   - What you're building (screenshot or wireframe)
   - Which existing component is closest
   - What's missing (a prop, a variant, a new component)
4. An engineer will evaluate whether to add it to the boilerplate or suggest an alternative using existing components

## Common Mistakes to Avoid

| Mistake | Why it's wrong | What to do instead |
|---------|---------------|-------------------|
| Creating files in `components/ui/` | Breaks all forks | Open an issue on the boilerplate repo |
| `npm install some-ui-lib` | Adds conflicting dependencies | Use existing components |
| Copy-pasting a component to modify | Creates unmaintainable duplicates | Use the component's props and variants |
| `style={{ color: 'red' }}` | Bypasses the theme system | Use `className="text-destructive"` |
| Hardcoding colors (`bg-blue-500`) | Ignores the theme | Use semantic colors: `bg-primary`, `text-foreground` |
| Importing from `@/lib/core` in client code | Server-only module | Ask an engineer to wire data |
