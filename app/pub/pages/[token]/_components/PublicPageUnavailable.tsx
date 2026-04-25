import { EmptyState } from '@/components/ui/molecules';

export function PublicPageUnavailable() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <EmptyState
        title="Page unavailable"
        description="This public link is invalid or has expired."
        status="error"
      />
    </div>
  );
}
