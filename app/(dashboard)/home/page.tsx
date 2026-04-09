import { Heading, Text } from '@/components/ui/atoms';
import { Card, CardContent } from '@/components/ui/molecules';
import { Alert } from '@/components/ui/molecules';
import Link from 'next/link';
import { Blocks, Bot, BookOpen, Settings } from 'lucide-react';
import { appConfig } from '@/config/app.config';

const quickLinks = [
  {
    href: '/ui',
    icon: Blocks,
    title: 'UI Showcase',
    description: 'Explore the atomic component library with live examples.',
  },
  {
    href: '/ai-builder',
    icon: Bot,
    title: 'AI Builder',
    description: 'Generate app schemas from natural language prompts.',
  },
];

export default function HomePage() {
  return (
    <div className="p-6 lg:p-8 space-y-10">
      <header className="mb-12">
        <Heading as="h1" color="primary" className="mb-3">
          Welcome to {appConfig.name}
        </Heading>
        <Text size="lg" color="muted" className="max-w-2xl">
          The atomic &ldquo;Lego Bucket&rdquo; foundation for AI-generated government
          applications. Built with Next.js App Router, Tailwind CSS, and Clean Architecture.
        </Text>
      </header>

      <section className="mb-12">
        <Heading as="h2" className="mb-6">Quick Start</Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickLinks.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Heading as="h3" className="text-base font-semibold mb-1">{title}</Heading>
                    <Text size="sm" color="muted">{description}</Text>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <Heading as="h2" className="mb-6">Architecture Overview</Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Blocks className="h-5 w-5 text-primary" />
                <Heading as="h3" className="text-sm font-semibold">Atomic Components</Heading>
              </div>
              <Text size="sm" color="muted">
                Atoms, Molecules, and Organisms in <code className="text-xs bg-muted px-1 py-0.5 rounded">components/ui/</code>.
                Fully customizable via props with smart defaults.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Settings className="h-5 w-5 text-primary" />
                <Heading as="h3" className="text-sm font-semibold">Clean Architecture</Heading>
              </div>
              <Text size="sm" color="muted">
                Ports &amp; Adapters in <code className="text-xs bg-muted px-1 py-0.5 rounded">lib/core/</code>.
                Swap API V1 to V2 by changing one file.
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <Heading as="h3" className="text-sm font-semibold">Config-Driven</Heading>
              </div>
              <Text size="sm" color="muted">
                Navigation, routes, and theming live in <code className="text-xs bg-muted px-1 py-0.5 rounded">config/</code>.
                AI edits config files, not component code.
              </Text>
            </CardContent>
          </Card>
        </div>
      </section>

      <Alert variant="warning" title="Before Production">
        Delete the <code className="font-mono bg-warning-light px-1.5 py-0.5 rounded text-xs">/app/(dashboard)/ui</code> and <code className="font-mono bg-warning-light px-1.5 py-0.5 rounded text-xs">/app/(dashboard)/ai-builder</code> directories
        before deploying to production. These are development-only tools.
      </Alert>
    </div>
  );
}
