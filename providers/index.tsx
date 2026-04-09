'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { SidebarProvider } from './sidebar-provider';
import { ToastProvider } from './toast-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
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
