import type { ReactNode } from 'react';
import { featureGuard } from '@/lib/feature-guards';

/**
 * Gates the entire UI showcase under `platform.uiShowcase`. The showcase pages
 * themselves are `'use client'` so a server-component layout is the cleanest
 * place to enforce the flag once for every nested route.
 */
export default async function UIShowcaseLayout({ children }: { children: ReactNode }) {
  await featureGuard('platform.uiShowcase');
  return <>{children}</>;
}
