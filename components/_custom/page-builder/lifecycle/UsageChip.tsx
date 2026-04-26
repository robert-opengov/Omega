'use client';

/**
 * UsageChip — shows how many pages reference a custom component and lets
 * the user expand into a list. Part of the
 * `app.customComponentLifecycle` UI surface.
 *
 * Pulls data via `getCustomComponentUsageAction`. The chip degrades to
 * "0 in use" until the action resolves, so the editor never blocks.
 */

import { useEffect, useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { Chip } from '@/components/ui/atoms';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/molecules';
import Link from 'next/link';
import { getCustomComponentUsageAction } from '@/app/actions/custom-components';
import type { CustomComponentUsage } from '@/lib/core/ports/custom-components.repository';

export function UsageChip({
  appId,
  componentKey,
}: {
  appId: string;
  componentKey: string;
}) {
  const [usage, setUsage] = useState<CustomComponentUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const res = await getCustomComponentUsageAction(appId, componentKey);
      if (!mounted) return;
      setLoading(false);
      if (res.success && res.data) setUsage(res.data);
    })();
    return () => {
      mounted = false;
    };
  }, [appId, componentKey]);

  const total = usage?.total ?? 0;
  const label = loading ? '…' : total === 1 ? '1 page' : `${total} pages`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label} use this component`}
          className="inline-flex"
          disabled={loading}
        >
          <Chip
            label={label}
            color={total > 0 ? 'info' : 'neutral'}
            size="sm"
            icon={LinkIcon}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2 text-sm">
        {usage && usage.pages.length > 0 ? (
          <ul className="divide-y divide-border">
            {usage.pages.map((p) => (
              <li key={p.key} className="py-1.5">
                <Link
                  href={`/apps/${appId}/pages/${p.key}/edit`}
                  className="hover:underline"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground p-1.5">
            Not referenced by any page yet.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
