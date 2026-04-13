'use client';

import type { ReactNode } from 'react';
import type { LoginMode } from '@/config/auth.config';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { SidebarProvider } from './sidebar-provider';
import { ToastProvider } from './toast-provider';

interface ProvidersProps {
  children: ReactNode;
  enableAuth?: boolean;
  loginMode?: LoginMode;
  enableSilentLogin?: boolean;
  enableSignup?: boolean;
}

export function Providers({ children, enableAuth = true, loginMode = 'both', enableSilentLogin = false, enableSignup = true }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider enableAuth={enableAuth} loginMode={loginMode} enableSilentLogin={enableSilentLogin} enableSignup={enableSignup}>
        <SidebarProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export { useTheme } from './theme-provider';
export { useAuth } from './auth-provider';
export { useSidebar } from './sidebar-provider';
export { useToast } from './toast-provider';
export type { Toast, ToastVariant } from './toast-provider';
