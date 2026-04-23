'use client';

import { Banner, Hero, SummaryCard, MetricCard, Alert } from '@/components/ui/molecules';
import { TrendingUp } from 'lucide-react';
import { Footer } from '@/components/ui/organisms';
import { Blocks, Settings, BookOpen, Bot, Palette, Shield, BarChart3, Component } from 'lucide-react';
import { appConfig } from '@/config/app.config';

const features = [
  {
    icon: Blocks,
    title: 'Atomic Components',
    description:
      'Atoms, Molecules, and Organisms ready to compose any UI. Fully themeable with HSL dark/light mode.',
    href: '/ui/atoms',
  },
  {
    icon: Settings,
    title: 'Clean Architecture',
    description:
      'Ports & Adapters pattern — swap API v1 for v2 by changing one adapter file.',
  },
  {
    icon: BookOpen,
    title: 'Config-Driven',
    description:
      'Navigation, routes, theming, and layout live in config files. AI edits configs, not components.',
  },
  {
    icon: Palette,
    title: 'HSL Theme System',
    description:
      'One hex value cascades to the entire shade scale. Seamless dark/light switching.',
  },
  {
    icon: Shield,
    title: 'Auth & Routes',
    description:
      'Middleware-based auth guards, role-based nav items, and configurable public routes.',
  },
  {
    icon: Bot,
    title: 'AI Builder',
    description:
      'Generate app schemas from natural language prompts. Build full CRUD pages in seconds.',
    href: '/ai-builder',
  },
];

const stats = [
  { title: 'Atoms', value: '28', icon: Component, change: '+12.5%', changeLabel: 'new in v2' },
  { title: 'Molecules', value: '36', icon: Blocks, change: '+18.0%', changeLabel: 'new in v2' },
  { title: 'Organisms', value: '13', icon: BarChart3, change: '+8.3%', changeLabel: 'new in v2' },
];

const footerSections = [
  {
    title: 'Components',
    links: [
      { label: 'Atoms', href: '/ui/atoms' },
      { label: 'Molecules', href: '/ui/molecules' },
      { label: 'Organisms', href: '/ui/organisms' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'AI Builder', href: '/ai-builder' },
      { label: 'UI Showcase', href: '/ui' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'GitHub', href: '#' },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 lg:p-8 space-y-8">
        <Banner variant="info" title="Welcome!" dismissible>
          You&apos;re running the {appConfig.name} boilerplate. Explore the component library or jump into the AI Builder.
        </Banner>

        <Hero
          title={`Welcome to ${appConfig.name}`}
          subtitle="The atomic foundation for AI-generated government applications. Built with Next.js, Tailwind CSS, and Clean Architecture."
          primaryAction={{ label: 'Explore Components', href: '/ui' }}
          secondaryAction={{ label: 'AI Builder', href: '/ai-builder' }}
          variant="image"
          backgroundImage="/brand/demo-bg-boston.webp"
          backgroundPosition="center"
          overlay="brand"
        />

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Platform Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <SummaryCard key={String(f.title)} variant="feature" {...f} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Component Library</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s) => (
              <MetricCard
                key={String(s.title)}
                title={s.title}
                value={s.value}
                icon={s.icon}
                trend={
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3 text-success-text" aria-hidden="true" />
                    <span className="text-success-text">{s.change}</span>
                    <span className="text-muted-foreground">{s.changeLabel}</span>
                  </div>
                }
              />
            ))}
          </div>
        </section>

        <Alert variant="warning" title="Before Production">
          Delete the <code className="font-mono bg-warning-light px-1.5 py-0.5 rounded text-xs">/app/(dashboard)/ui</code> and{' '}
          <code className="font-mono bg-warning-light px-1.5 py-0.5 rounded text-xs">/app/(dashboard)/ai-builder</code> directories
          before deploying to production. These are development-only tools.
        </Alert>
      </div>

      <Footer sections={footerSections} />
    </div>
  );
}
