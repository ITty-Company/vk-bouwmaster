"use client"

import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';
import { Footer } from './footer';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PushTestPanel } from '@/components/push-test-panel';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    return (
      <LanguageProvider>
        {children}
        <PushTestPanel />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <Navigation />
      <main className="pt-0">
        {children}
      </main>
      <Footer />
      <PushTestPanel />
    </LanguageProvider>
  );
}

