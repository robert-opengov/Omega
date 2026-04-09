/**
 * Shared Tailwind class constants for all cell editors.
 * Uses the project's HSL design tokens for consistent theming.
 */

export const EDITOR_BASE = [
  'border-2 border-primary bg-background text-foreground',
  'text-sm font-normal',
  'rounded',
  'shadow-soft',
  'transition-colors duration-150',
  'focus:outline-none focus:border-primary',
].join(' ');

export const EDITOR_INPUT = [
  EDITOR_BASE,
  'h-full w-full px-2',
  'placeholder:text-muted-foreground',
].join(' ');

export const EDITOR_SELECT = [
  EDITOR_BASE,
  'h-full w-full px-2',
  'cursor-pointer',
  'appearance-none',
].join(' ');

export const EDITOR_ERROR = [
  'border-danger text-danger',
  'focus:border-danger',
].join(' ');
