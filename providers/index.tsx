'use client';

import type { ReactNode } from 'react';
import type { LoginMode } from '@/config/auth.config';
import type { ModulesConfig } from '@/config/modules.config';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { SidebarProvider } from './sidebar-provider';
import { ToastProvider } from './toast-provider';
import { ModuleFlagsProvider } from './module-flags-provider';
import { AiSurface } from '@/components/_custom/ai/AiSurface';

interface ProvidersProps {
  children: ReactNode;
  enableAuth?: boolean;
  loginMode?: LoginMode;
  enableSilentLogin?: boolean;
  enableSignup?: boolean;
  /**
   * Effective modules computed server-side (env baseline + cookie
   * overrides). Optional so test harnesses and isolated renders can
   * skip it; the provider falls back to the static baseline.
   */
  modules?: ModulesConfig;
}

export function Providers({ children, enableAuth = true, loginMode = 'both', enableSilentLogin = false, enableSignup = true, modules }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ModuleFlagsProvider initialModules={modules}>
        <AuthProvider enableAuth={enableAuth} loginMode={loginMode} enableSilentLogin={enableSilentLogin} enableSignup={enableSignup}>
          <SidebarProvider>
            <ToastProvider>
              {children}
              <AiSurface />
            </ToastProvider>
          </SidebarProvider>
        </AuthProvider>
      </ModuleFlagsProvider>
    </ThemeProvider>
  );
}

export { useTheme } from './theme-provider';
export { useAuth } from './auth-provider';
export { useSidebar } from './sidebar-provider';
export { useToast } from './toast-provider';
export { useModuleEnabled, useModuleFlags } from './module-flags-provider';
export type { Toast, ToastVariant } from './toast-provider';
