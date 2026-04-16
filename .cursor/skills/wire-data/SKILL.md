# Skill: Wire Data to Components

This skill teaches how to get data from the GAB backend into React components. There are two patterns. Use the right one depending on the situation.

## The Rule

**Client components (`'use client'`) never import from `@/lib/core`.**

The data layer uses server-only APIs — `cookies()`, `process.env` secrets, Node.js `fetch` with auth headers. Importing it in a client component breaks the build or leaks secrets.

Client components get data in exactly two ways:
1. **Props** from a Server Component parent (Pattern A)
2. **Server Actions** called from event handlers (Pattern B)

## Pattern A — Server Component Props

**Use for:** Initial page data, any data needed on first render.

The page file is an `async` Server Component (no `'use client'`). It imports the repo, awaits the data, and passes it as plain props to a client component that handles rendering.

### The page (Server Component)

```typescript
// app/(dashboard)/permitting/applications/page.tsx
import { permittingRepo } from '@/lib/core';
import { ApplicationsListPage } from './_components/ApplicationsListPage';

export default async function PermittingApplicationsPage() {
  const applications = await permittingRepo.listApplications();
  return <ApplicationsListPage applications={applications} />;
}
```

Key points:
- `import { permittingRepo } from '@/lib/core'` — only works in Server Components
- `Promise.all()` for parallel fetches — faster than sequential `await`
- Props must be **serializable** (plain objects, arrays, strings, numbers — no functions, classes, or Dates)

### The component (Client Component)

```typescript
// app/(dashboard)/permitting/applications/_components/ApplicationsListPage.tsx
'use client';

import { Badge } from '@/components/ui/atoms';
import { SectionHeader, DataTable } from '@/components/ui/molecules';
import type { PermitApplication, PaginatedResult } from '@/lib/core/ports/permitting.repository';

interface ApplicationsListPageProps {
  applications: PaginatedResult<PermitApplication>;
}

export function ApplicationsListPage({ applications }: ApplicationsListPageProps) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-foreground">Permit Applications</h1>
      {/* Render using only @/components/ui/* imports */}
    </div>
  );
}
```

Key points:
- `'use client'` at the top — this component ships JavaScript to the browser
- Imports **types** from ports (types are erased at build time — safe in client code)
- Imports **components** only from `@/components/ui/*`
- Never imports repos, adapters, or server actions at the module level

### When to use Pattern A

- Page load data (dashboards, lists, detail views)
- Data that doesn't change based on user interaction
- SEO-relevant content (server-rendered HTML)

## Pattern B — Server Actions

**Use for:** Mutations, form submissions, user-triggered fetches, anything that happens after the page loads.

A Server Action is a function in a `'use server'` file that runs on the server but can be called from client code like a regular async function.

### The action (Server)

```typescript
// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { authPort } from '@/lib/core';

export async function loginAction(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await authPort.login({ username, password });

    const cookieStore = await cookies();
    cookieStore.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expiresIn,
      path: '/',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}
```

### The component (Client)

```typescript
// Inside a 'use client' component
import { loginAction } from '@/app/actions/auth';

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    const result = await loginAction(data.email, data.password);

    if (!result.success) {
      setError(result.error ?? 'Login failed');
    }
    setLoading(false);
  };

  // Render form...
}
```

### Creating a data mutation action

```typescript
// app/actions/permitting.ts
'use server';

import { permittingRepo } from '@/lib/core';
import { revalidatePath } from 'next/cache';

export async function createApplicationAction(data: {
  title: string;
  description: string;
  type: string;
  address: string;
}) {
  try {
    const application = await permittingRepo.createApplication({
      ...data,
      status: 'draft',
      applicant: 'Current User',
    });

    revalidatePath('/permitting/applications');
    return { success: true, data: application };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create application',
    };
  }
}
```

### When to use Pattern B

- Form submissions (login, create, update, delete)
- Any action triggered by user interaction (button click, search)
- Operations that need to write cookies or revalidate cached pages
- Any mutation that changes server-side state

## Anti-Patterns (Never Do These)

### Importing `@/lib/core` in a client component

```typescript
// BAD — will break the build
'use client';
import { permittingRepo } from '@/lib/core';  // Server-only module in client code
```

### Fetching in useEffect

```typescript
// BAD — bypasses the data layer, duplicates auth logic
'use client';
useEffect(() => {
  fetch('/api/permitting/applications').then(r => r.json()).then(setData);
}, []);
```

### Building raw fetch calls to the GAB API

```typescript
// BAD — skips the adapter, couples to a specific API version
const res = await fetch('https://api.gab.dev/v2/apps/xyz/tables/abc/records');
```

### Passing non-serializable props

```typescript
// BAD — functions, Dates, class instances can't cross the server/client boundary
<ClientComponent onFetch={permittingRepo.listApplications} />
```

## Decision Tree

```
Is this data needed on first page render?
├── Yes → Pattern A (Server Component + props)
└── No, it's triggered by user action
    └── Pattern B (Server Action)

Is this a read or a write?
├── Read on page load → Pattern A
├── Read after user interaction → Pattern B (Server Action that calls repo)
└── Write (create/update/delete) → Pattern B (Server Action + revalidatePath)
```

## Real Examples in the Codebase

| Pattern | File | What it does |
|---------|------|-------------|
| B | `app/actions/auth.ts` → `loginAction` | Authenticates user, sets cookies |
| B | `app/(dashboard)/ai-builder/actions.ts` → `buildAppAction` | Creates GAB app schema from AI prompt |
