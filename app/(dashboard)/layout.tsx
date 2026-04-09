import { DashboardLayout } from '@/components/ui/layouts';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
