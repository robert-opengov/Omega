'use client';

import { createContext, useState, useEffect, useContext, useMemo, type ReactNode } from 'react';

const SIDEBAR_STORAGE_KEY = 'g-bp-sidebar-v2';

interface SidebarContextType {
  isMobileOpen: boolean;
  isDesktopCollapsed: boolean;
  toggleDesktopCollapsed: () => void;
  toggleMobileOpen: () => void;
  closeMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) setIsDesktopCollapsed(saved === 'true');
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isDesktopCollapsed));
    }
  }, [isDesktopCollapsed, isInitialized]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const value = useMemo(() => ({
    isMobileOpen,
    isDesktopCollapsed,
    toggleDesktopCollapsed: () => setIsDesktopCollapsed((p) => !p),
    toggleMobileOpen: () => setIsMobileOpen((p) => !p),
    closeMobileSidebar: () => setIsMobileOpen(false),
  }), [isMobileOpen, isDesktopCollapsed]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
