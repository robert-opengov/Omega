'use client';

import type { ReactNode } from 'react';
import type { LoginMode } from '@/config/auth.config';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { SidebarProvider } from './sidebar-provider';
import { ToastProvider } from './toast-provider';

interface ProvidersProps {
  children: ReactNode;
  loginMode?: LoginMode;
  enableSilentLogin?: boolean;
}

export function Providers({ children, loginMode = 'both', enableSilentLogin = false }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider loginMode={loginMode} enableSilentLogin={enableSilentLogin}>
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
