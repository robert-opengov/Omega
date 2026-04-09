import Link from 'next/link';
import { Heading, Text } from '@/components/ui/atoms';
import { Card, CardContent } from '@/components/ui/molecules';
import { Atom, Puzzle, LayoutPanelTop } from 'lucide-react';

const categories = [
  {
    href: '/ui/atoms',
    icon: Atom,
    title: 'Atoms',
    count: 27,
    description: 'The smallest building blocks: buttons, inputs, badges, chips, spinners, typography, and more.',
    examples: 'Button, Input, Badge, Chip, ButtonGroup, Link, NumberInput, Switch, Avatar...',
  },
  {
    href: '/ui/molecules',
    icon: Puzzle,
    title: 'Molecules',
    count: 31,
    description: 'Combinations of atoms that form reusable UI patterns: forms, tables, modals, lists, timelines.',
    examples: 'DataTable, Modal, Tabs, Card, List, Timeline, Toolbar, LabelValuePair, Result...',
  },
  {
    href: '/ui/organisms',
    icon: LayoutPanelTop,
    title: 'Organisms',
    count: 11,
    description: 'Complex, self-contained sections composed of atoms and molecules, including AI components and a full spreadsheet table.',
    examples: 'ChildTable, AuthForm, DataGrid, ChartCard, Logo, AIConversation, AIDisclaimer, AIPromptInput',
  },
];

export default function UIShowcasePage() {
  return (
    <div className="p-6 lg:p-8 space-y-10">
      <header>
        <Heading as="h1" color="primary" className="mb-2">UI Component Library</Heading>
        <Text color="muted" className="max-w-3xl">
          The atomic &ldquo;Lego Bucket&rdquo; — every component the AI or developer needs to build
          government applications. Organized by complexity: Atoms, Molecules, and Organisms. Each page
          includes live demos with interactive variants and a collapsible props reference.
        </Text>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map(({ href, icon: Icon, title, count, description, examples }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-medium hover:border-primary/30">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{count}</span>
                </div>
                <div>
                  <Heading as="h2" className="text-lg font-semibold mb-1">{title}</Heading>
                  <Text size="sm" color="muted">{description}</Text>
                </div>
                <Text size="xs" color="muted" className="opacity-70 font-mono mt-auto">{examples}</Text>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
