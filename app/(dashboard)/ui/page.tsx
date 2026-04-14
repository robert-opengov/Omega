'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/atoms';
import { Hero } from '@/components/ui/molecules';
import { Atom, Puzzle, LayoutPanelTop } from 'lucide-react';
import { ShowcaseLayout } from './_components/ShowcaseLayout';

const categories = [
  {
    href: '/ui/atoms',
    icon: Atom,
    title: 'Atoms',
    count: 30,
    description: 'The smallest building blocks — primitives that can\'t be broken down further.',
    highlights: [
      'Button, Input, Textarea, Select',
      'Badge, Chip, Toggle, Slider',
      'Avatar, Skeleton, Progress, Spinner',
      'SelectionCard, StatusStep, StatBadge',
    ],
  },
  {
    href: '/ui/molecules',
    icon: Puzzle,
    title: 'Molecules',
    count: 40,
    description: 'Composed atoms forming reusable UI patterns for forms, data, and overlays.',
    highlights: [
      'ContentHeader, DataTable, Card, Modal',
      'WizardCard, CollapsibleTable, UploadSlot',
      'StatusChecklist, Banner, Hero',
      'PageHeader, Pagination, CommandPalette',
    ],
  },
  {
    href: '/ui/organisms',
    icon: LayoutPanelTop,
    title: 'Organisms',
    count: 15,
    description: 'Complex, self-contained sections that compose full page areas.',
    highlights: [
      'GanttChart (resource schedule grid)',
      'FullscreenWizard, ChildTable',
      'AuthForm, DataGrid, ChartCard',
      'AIConversation, AIPromptInput, Footer',
    ],
  },
];

export default function UIShowcasePage() {
  return (
    <ShowcaseLayout>
      <div className="space-y-8">
        <Hero
          title="Component Library"
          subtitle="The atomic &ldquo;Lego Bucket&rdquo; — every component the AI or developer needs to build government applications. Organized by complexity with live demos and collapsible props references."
          primaryAction={{ label: 'Browse Atoms', href: '/ui/atoms' }}
          secondaryAction={{ label: 'Browse Molecules', href: '/ui/molecules' }}
          variant="gradient"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map(({ href, icon: Icon, title, count, description, highlights }) => (
            <Link key={href} href={href} className="group">
              <div className="h-full rounded-xl border border-border bg-card p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-medium hover:border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="default" size="sm">{count} components</Badge>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <ul className="mt-auto space-y-1.5">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/40 shrink-0" aria-hidden="true" />
                      <span className="font-mono opacity-80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ShowcaseLayout>
  );
}
