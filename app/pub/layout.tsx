export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-canvas p-6">
      <div className="mx-auto max-w-3xl rounded border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
