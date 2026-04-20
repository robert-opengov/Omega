'use client';

import { useAuth, useTheme } from '@/providers';
import { Avatar, Badge, Heading, Text, Separator, Switch, Skeleton } from '@/components/ui/atoms';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/molecules';
import { User, Palette, Shield, Building2, Mail, Hash, UserCircle } from 'lucide-react';

function roleBadgeVariant(role: string) {
  if (role === 'superadmin') return 'danger' as const;
  if (role === 'admin') return 'primary' as const;
  return 'default' as const;
}

function roleLabel(role: string) {
  if (role === 'superadmin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'Participant';
}

function InfoRow({ icon: Icon, label, value }: Readonly<{ icon: typeof Mail; label: string; value: string }>) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <Text size="xs" color="muted" className="mb-0.5">{label}</Text>
        <Text size="sm" className="break-all">{value || '—'}</Text>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Skeleton variant="circular" width="4rem" height="4rem" />
          <div className="space-y-2">
            <Skeleton variant="text" width="10rem" height="1.25rem" />
            <Skeleton variant="text" width="14rem" height="1rem" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="text" width="100%" height="2.5rem" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile and preferences"
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="h-4 w-4 mr-1.5" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
            Profile tab
            ============================================================ */}
        <TabsContent value="profile">
          {isLoading && <ProfileSkeleton />}
          {!isLoading && !user && (
            <Card>
              <CardContent className="p-6">
                <Text color="muted">No user session found. Please log in again.</Text>
              </CardContent>
            </Card>
          )}
          {!isLoading && user && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar size="xl" fallback={user.fullName} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Heading as="h2" className="text-xl">
                          {user.fullName}
                        </Heading>
                        <Badge variant={roleBadgeVariant(user.role)} size="sm">
                          <Shield className="h-3 w-3 mr-1" />
                          {roleLabel(user.role)}
                        </Badge>
                      </div>
                      <Text size="sm" color="muted" className="mt-0.5">
                        {user.email}
                      </Text>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Information from your organization account. Contact your administrator to make changes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="divide-y divide-border">
                    <InfoRow icon={Mail} label="Email" value={user.email} />
                    <InfoRow icon={UserCircle} label="Username" value={user.userName} />
                    <InfoRow icon={Hash} label="User ID" value={user.userId} />
                    {user.clientId && <InfoRow icon={Building2} label="Client ID" value={user.clientId} />}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ============================================================
            Preferences tab
            ============================================================ */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Text size="sm" weight="medium">Dark Mode</Text>
                    <Text size="xs" color="muted" className="mt-0.5">
                      {resolvedTheme === 'dark'
                        ? 'Currently using dark theme'
                        : 'Currently using light theme'}
                    </Text>
                  </div>
                  <Switch
                    checked={resolvedTheme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <Text size="sm" weight="medium">Use System Theme</Text>
                    <Text size="xs" color="muted" className="mt-0.5">
                      Automatically match your operating system settings
                    </Text>
                  </div>
                  <Switch
                    checked={theme === 'system'}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? 'system' : resolvedTheme)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
