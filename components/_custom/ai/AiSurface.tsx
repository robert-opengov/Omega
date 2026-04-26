'use client';

/**
 * Floating AI surface — renders the trigger button(s) for the AI
 * Assistant and AI Builder drawers and owns their open state.
 *
 * Mounted near the root of the app (in `providers/index.tsx`) so the
 * drawers are summonable from any page. Both flags are checked here so
 * a flag flip immediately hides the trigger; the drawer modules are
 * imported lazily so a fork that disables both flags pays no client
 * bundle cost for the AI feature.
 */

import { useState, lazy, Suspense } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { useModuleEnabled } from '@/providers/module-flags-provider';
import { Button } from '@/components/ui/atoms';

const AiAssistantDrawer = lazy(() =>
  import('./AiAssistantDrawer').then((m) => ({ default: m.AiAssistantDrawer })),
);
const AiBuilderDrawer = lazy(() =>
  import('./AiBuilderDrawer').then((m) => ({ default: m.AiBuilderDrawer })),
);

export function AiSurface() {
  const assistantEnabled = useModuleEnabled('services.aiAssistant');
  const builderEnabled = useModuleEnabled('services.aiAppBuilder');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  if (!assistantEnabled && !builderEnabled) return null;

  return (
    <>
      <div
        className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 print:hidden"
        data-ai-surface="root"
      >
        {assistantEnabled && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={() => setAssistantOpen(true)}
            className="shadow-lg"
          >
            Assistant
          </Button>
        )}
        {builderEnabled && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Wand2}
            onClick={() => setBuilderOpen(true)}
            className="shadow-lg"
          >
            Builder
          </Button>
        )}
      </div>

      {assistantEnabled && assistantOpen && (
        <Suspense fallback={null}>
          <AiAssistantDrawer open={assistantOpen} onOpenChange={setAssistantOpen} />
        </Suspense>
      )}
      {builderEnabled && builderOpen && (
        <Suspense fallback={null}>
          <AiBuilderDrawer open={builderOpen} onOpenChange={setBuilderOpen} />
        </Suspense>
      )}
    </>
  );
}
