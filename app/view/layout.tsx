/**
 * Fullscreen / minimal shell for /view/... (no dashboard chrome).
 * Still uses root layout (Providers, fonts).
 */
export default function ViewLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
