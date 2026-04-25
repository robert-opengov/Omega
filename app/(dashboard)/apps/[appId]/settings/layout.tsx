import { SettingsSubNav } from './_components/SettingsSubNav';

export default async function AppSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return (
    <div className="space-y-6">
      <SettingsSubNav appId={appId} />
      {children}
    </div>
  );
}
