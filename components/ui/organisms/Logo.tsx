'use client';

import { cn } from '@/lib/utils';
import { appConfig } from '@/config/app.config';
import { useInlineSvg } from '@/hooks';

/**
 * Application Logo — full wordmark version (mark + text).
 *
 * The mark (chevron) uses `var(--primary)` so it adapts to any brand color.
 * The wordmark text paths use `currentColor` — black in light mode,
 * white in dark mode (controlled by the parent's text color class).
 *
 * When `appConfig.logo.url` points to a local `.svg` file (e.g. `/brand/logo.svg`),
 * the SVG is fetched and inlined so `currentColor` / CSS custom properties inherit
 * from the parent. For external URLs or raster images, a plain `<img>` is rendered —
 * those logos must ship assets that work on both light and dark backgrounds.
 */
export function Logo({ className }: { className?: string }) {
  const customLogoUrl = appConfig.logo?.url;
  const { markup, isInlineable } = useInlineSvg(customLogoUrl);

  if (customLogoUrl) {
    if (isInlineable && markup) {
      return (
        <div
          className={cn('flex items-center gap-2 [&>svg]:h-7 [&>svg]:w-auto [&>svg]:max-w-[200px]', className)}
          role="img"
          aria-label={appConfig.logo?.alt || appConfig.name}
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      );
    }
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customLogoUrl}
          alt={appConfig.logo?.alt || appConfig.name}
          className="h-7 w-auto max-w-[200px] object-contain"
        />
      </div>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1187.1 227.9"
      className={cn('h-7 w-auto', className)}
      aria-label={appConfig.name}
    >
      <path
        fill="var(--primary)"
        d="M1177.7,0h-207.2c-9.5,0-12.8,12.5-4.6,17.3l99,57.1v114.3c0,9.5,12.5,12.8,17.3,4.6l103.6-179.5c3.6-6.2-.9-13.9-8-13.9h0q0,0,0,0Z"
      />
      <g fill="currentColor">
        <path d="M178.8,74.1h24.2v153.8h-24.2V74.1ZM196.3,100c4.3-8.8,10.4-15.7,18.1-20.6,7.8-5,16.7-7.5,26.8-7.5s19.3,2.5,27.5,7.6c8.3,5,14.8,11.9,19.6,20.7,4.7,8.8,7.1,18.5,7.1,29.2s-2.4,20.4-7.1,29.2c-4.7,8.8-11.3,15.7-19.6,20.7-8.3,5-17.5,7.6-27.5,7.6s-19-2.5-26.8-7.5-13.8-11.8-18.1-20.6c-4.3-8.8-6.5-18.6-6.5-29.4s2.2-20.6,6.5-29.4h0ZM207.5,147.4c3,5.4,7,9.7,12.2,12.7,5.2,3.1,10.9,4.6,17.3,4.6s12.1-1.5,17.2-4.6,9.1-7.3,12.1-12.7,4.4-11.4,4.4-18-1.5-12.6-4.4-18c-3-5.4-7-9.6-12.2-12.7-5.2-3.1-10.9-4.6-17.3-4.6s-12.1,1.5-17.2,4.6-9.1,7.3-12.1,12.7-4.4,11.4-4.4,18,1.5,12.6,4.4,18h0Z" />
        <path d="M332.4,118.8h75.8l-5.6,7.8c-.4-6.3-2.1-12.1-5-17.3s-6.8-9.3-11.9-12.2c-5-3-10.7-4.4-17.1-4.4s-12.1,1.6-17.3,4.9c-5.2,3.2-9.3,7.7-12.3,13.3s-4.5,11.8-4.5,18.6,1.5,13.1,4.6,18.7c3.1,5.5,7.3,9.9,12.7,13.2,5.4,3.2,11.6,4.9,18.5,4.9s13.1-1.7,18.7-5.1c5.5-3.4,9.8-8,12.9-13.7l20.1,8.9c-4.9,9.4-11.9,16.8-21.1,22.4-9.1,5.5-19.6,8.3-31.2,8.3s-20.9-2.5-29.8-7.6c-8.9-5-16-11.9-21.2-20.7-5.2-8.8-7.8-18.5-7.8-29.2s2.5-20.4,7.6-29.2,11.9-15.7,20.7-20.7c8.8-5,18.6-7.6,29.4-7.6s22.3,3,31.5,8.9,16.1,13.9,20.7,23.9,6.1,21,4.5,32.9h-93.1v-18.8h0l.2-.2h0Z" />
        <path d="M447.1,74.1h24.2v26.3l-3.9-5c3.7-7.2,9.1-12.9,16-17.2,6.9-4.2,14.8-6.4,23.5-6.4s16.9,2,23.9,6.1c7,4,12.4,9.6,16.2,16.6s5.7,15,5.7,23.8v66.3h-24v-62.4c0-5.3-1.2-10.2-3.7-14.5s-5.9-7.7-10.3-10.2c-4.4-2.4-9.3-3.7-14.8-3.7s-10.4,1.2-14.8,3.7c-4.4,2.5-7.8,5.8-10.3,10.2-2.5,4.3-3.7,9.1-3.7,14.5v62.4h-24.2v-110.6h.2q0,.1,0,0Z" />
        <path d="M749,100.2c5.2-8.8,12.2-15.7,21.2-20.7s18.9-7.6,29.8-7.6,20.9,2.5,29.8,7.6c8.9,5,16,11.9,21.2,20.7s7.8,18.5,7.8,29.2-2.6,20.4-7.8,29.2c-5.2,8.8-12.2,15.7-21.2,20.7-8.9,5-18.9,7.6-29.8,7.6s-20.9-2.5-29.8-7.6c-8.9-5-16-11.9-21.2-20.7-5.2-8.8-7.8-18.5-7.8-29.2s2.6-20.4,7.8-29.2ZM770.5,147.4c3,5.4,7,9.7,12.2,12.7,5.2,3.1,10.9,4.6,17.3,4.6s12.1-1.5,17.3-4.6,9.3-7.3,12.2-12.7,4.4-11.4,4.4-18-1.5-12.6-4.4-18c-3-5.4-7-9.6-12.2-12.7-5.2-3.1-10.9-4.6-17.3-4.6s-12.1,1.5-17.3,4.6-9.3,7.3-12.2,12.7-4.4,11.4-4.4,18,1.5,12.6,4.4,18h0Z" />
        <path d="M860,74.1h25.9l42.1,109.9h-17.7l42.1-109.9h24.4l-44.7,110.6h-27.2l-44.9-110.6h0Z" />
        <path d="M729.5,109.1c0,4-.3,7.8-.9,11.6-5.6,38.1-38.5,67.4-78.2,67.4s-79.1-35.4-79.1-79,35.4-79.1,79.1-79.1,54.8,15.9,68.4,39.5l-22.6,13.1c-9.1-15.8-26.2-26.5-45.8-26.5-29.2,0-52.9,23.7-52.9,52.9s23.7,52.9,52.9,52.9,46.3-17.7,51.6-41.3h-58.4l13.5-23.3h71.5c.6,3.8.9,7.7.9,11.7h0Z" />
        <path d="M79.1,30C35.4,30,0,65.4,0,109.1s35.4,79,79.1,79,79-35.4,79-79S122.7,30,79.1,30h0ZM79.1,162c-29.2,0-52.9-23.7-52.9-52.9s23.7-52.9,52.9-52.9,52.9,23.7,52.9,52.9-23.7,52.9-52.9,52.9h0Z" />
      </g>
    </svg>
  );
}

/**
 * Square logo mark (icon only) for the collapsed sidebar.
 *
 * Uses `var(--primary)` for fill — adapts to any brand color automatically.
 * In dark mode, the primary color is already lightened by the CSS token system.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 245.3 215.1"
      className={cn('h-8 w-8', className)}
      aria-label={appConfig.name}
    >
      <path
        fill="var(--primary)"
        d="M235.2,0H10.1C-.2,0-3.9,13.6,5,18.7l107.5,62.1v124.2c0,10.3,13.6,13.9,18.7,5L243.9,15.1c3.9-6.7-1-15.1-8.7-15.1Z"
      />
    </svg>
  );
}

export default Logo;
