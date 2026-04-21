import { useEffect, useState } from 'react';

export interface UseInlineSvgResult {
  markup: string | null;
  isInlineable: boolean;
}

/**
 * Fetches a local SVG file and returns its raw markup for inline rendering.
 * This allows SVG `fill="currentColor"` to inherit from the parent's text color,
 * which is impossible when SVGs are rendered via `<img>` tags.
 *
 * Only activates for local paths (starting with `/`) ending in `.svg`.
 * External URLs and non-SVG images are skipped (returns `{ markup: null, isInlineable: false }`).
 */
export function useInlineSvg(url: string | undefined | null): UseInlineSvgResult {
  const isInlineable = Boolean(
    url && url.startsWith('/') && url.toLowerCase().endsWith('.svg'),
  );
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    if (!isInlineable || !url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (!cancelled) setMarkup(text);
      })
      .catch(() => {
        if (!cancelled) setMarkup(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, isInlineable]);

  return { markup: isInlineable ? markup : null, isInlineable };
}
