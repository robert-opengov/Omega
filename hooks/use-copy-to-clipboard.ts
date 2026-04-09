'use client';

import { useState, useCallback } from 'react';

export function useCopyToClipboard(): { copied: boolean; copy: (text: string) => Promise<void> } {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  return { copied, copy };
}
