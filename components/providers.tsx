'use client';

import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/toast';
import { ConfirmProvider } from '@/components/modal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>{children}</AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
